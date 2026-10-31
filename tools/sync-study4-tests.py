#!/usr/bin/env python3
"""Sync all Study4 HSK 1-6 exams (351 tests) into study4-tests-data.json.gz.

Requires an authenticated Study4 sessionid cookie passed via --session or STUDY4_SESSION_ID env var.
Never commits or stores credentials in the repository.
"""
import argparse
import gzip
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parent.parent

SEEDS = [
    (1, "4905", "HSK 1 Practice test 1", "https://study4.com/tests/4905/hsk-1-practice-test-1/"),
    (2, "4918", "HSK 2 Practice test 2", "https://study4.com/tests/4918/hsk-2-practice-test-2/"),
    (3, "5048", "HSK 3 Practice test 34", "https://study4.com/tests/5048/hsk-3-practice-test-34/"),
    (4, "6743", "HSK 4 Advanced test 1", "https://study4.com/tests/6743/hsk-4-advanced-test-1/"),
    (5, "6753", "HSK 5 Advanced test 1", "https://study4.com/tests/6753/hsk-5-advanced-test-1/"),
    (6, "6785", "HSK 6 Advanced test 4", "https://study4.com/tests/6785/hsk-6-advanced-test-4/"),
]

def fetch(url, session_id):
    cmd = [
        "curl.exe" if os.name == "nt" else "curl",
        "-s", "-L",
        "-H", f"Cookie: sessionid={session_id}",
        "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        url
    ]
    return subprocess.check_output(cmd).decode("utf-8", "ignore")

def fix_urls(html_str):
    if not html_str:
        return ""
    s = html_str.strip()
    s = re.sub(r'src=["\']/media/', 'src="https://s4-media1.study4.com/media/', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def clean_inner_html(el):
    if not el:
        return ""
    for bad in el.find_all(["script", "style"]):
        bad.decompose()
    inner = "".join(str(c) for c in el.contents).strip()
    inner = fix_urls(inner)
    soup_check = BeautifulSoup(inner, "html.parser")
    if not soup_check.get_text(strip=True) and not soup_check.find("img"):
        return ""
    return inner

def extract_audio_url(el):
    if not el:
        return ""
    for src in el.find_all("source"):
        u = src.get("src", "").strip()
        if u.startswith("http"):
            return u
        if u.startswith("/media/"):
            return "https://s4-media1.study4.com" + u
    for aud in el.find_all("audio"):
        u = aud.get("src", "").strip()
        if u:
            return u if u.startswith("http") else "https://s4-media1.study4.com" + u
    return ""

def parse_solutions(sol_html):
    soup = BeautifulSoup(sol_html, "html.parser")
    q_sol = {}
    for qw in soup.find_all("div", class_="question-wrapper"):
        qid = str(qw.get("data-qid", "")).strip()
        if not qid:
            continue
        ans = ""
        for succ in qw.find_all(class_="text-success"):
            txt = succ.get_text(" ", strip=True)
            m = re.search(r"Đáp án đúng:\s*(.+)", txt)
            if m:
                ans = m.group(1).strip()
                break
        trans_html = ""
        parent_item = qw.find_parent("div", class_="question-item-wrapper")
        if parent_item:
            for tr in parent_item.find_all("div", class_="context-transcript"):
                col = tr.find("div", class_="collapse") or tr
                trans_html = clean_inner_html(col)
                if trans_html:
                    break
        group_trans_html = ""
        parent_grp = qw.find_parent("div", class_="question-group-wrapper")
        if parent_grp:
            for tr in parent_grp.find_all("div", class_="context-transcript"):
                if tr.find_parent("div", class_="question-item-wrapper") is None:
                    col = tr.find("div", class_="collapse") or tr
                    group_trans_html = clean_inner_html(col)
                    if group_trans_html:
                        break
        expl_html = ""
        expl_el = qw.find("div", class_="question-explanation-wrapper")
        if expl_el:
            col = expl_el.find("div", class_="collapse") or expl_el
            expl_html = clean_inner_html(col)
        q_sol[qid] = {
            "answer": ans,
            "transcriptHtml": trans_html,
            "groupTranscriptHtml": group_trans_html,
            "explanationHtml": expl_html
        }
    return q_sol

def parse_question_item(item_el, q_sol):
    qw = item_el.find("div", class_="question-wrapper")
    if not qw:
        return None
    qid = str(qw.get("data-qid", "")).strip()
    num_el = qw.find("div", class_="question-number")
    num_txt = num_el.get_text(strip=True) if num_el else "0"
    number = int(re.sub(r"\D", "", num_txt) or "0")

    ctx_html = ""
    item_audio = ""
    for cw in item_el.find_all("div", class_="context-wrapper", recursive=False):
        aud = extract_audio_url(cw)
        if aud:
            item_audio = aud
        for cc in cw.find_all("div", class_="context-content"):
            classes = cc.get("class") or []
            if "context-transcript" in classes or "context-audio" in classes:
                continue
            h = clean_inner_html(cc)
            if h:
                ctx_html = (ctx_html + " " + h).strip() if ctx_html else h

    qc = qw.find("div", class_="question-content")
    ordering = []
    prompt_html = ""
    if qc:
        ord_el = qc.find("div", class_="question-ordering")
        if ord_el:
            for oi in ord_el.find_all("div", class_="question-ordering-item"):
                t = oi.get_text(strip=True)
                t = re.sub(r"^\[|\]$", "", t).strip()
                if t:
                    ordering.append(t)
        for qt in qc.find_all("div", class_="question-text"):
            if "question-ordering" in (qt.get("class") or []):
                continue
            h = clean_inner_html(qt)
            if h:
                prompt_html = (prompt_html + " " + h).strip() if prompt_html else h

    options = []
    kind = "input"
    qa = qw.find("div", class_="question-answers")
    if qa:
        radios = qa.find_all("input", attrs={"type": "radio"})
        if radios:
            kind = "choice"
            for r in radios:
                val = str(r.get("value", "")).strip()
                fc = r.find_parent("div", class_="form-check")
                lbl_el = fc.find("label") if fc else None
                lbl_text = lbl_el.get_text(" ", strip=True) if lbl_el else val
                lbl_html = clean_inner_html(lbl_el) if lbl_el else val
                options.append({"value": val, "label": lbl_text, "html": lbl_html})
        elif qa.find("textarea"):
            kind = "essay"
        elif ordering:
            kind = "order"
        else:
            kind = "input"

    sol = q_sol.get(qid, {})
    q_obj = {"qid": qid, "number": number, "kind": kind, "answer": sol.get("answer", "")}
    if ctx_html:
        q_obj["contextHtml"] = ctx_html
    if item_audio:
        q_obj["audio"] = item_audio
    if prompt_html:
        q_obj["promptHtml"] = prompt_html
    if ordering:
        q_obj["ordering"] = ordering
    if options:
        q_obj["options"] = options
    if sol.get("transcriptHtml"):
        q_obj["transcriptHtml"] = sol["transcriptHtml"]
    if sol.get("explanationHtml"):
        q_obj["explanationHtml"] = sol["explanationHtml"]
    return q_obj

def parse_test(item, session_id):
    level = item["level"]
    tid = item["id"]
    legacy_title = item.get("legacyTitle")
    legacy_url = item.get("legacyUrl")

    s_html = fetch(f"https://study4.com/tests/{tid}/start/", session_id)
    soup = BeautifulSoup(s_html, "html.parser")
    canonical_path = f"/tests/{tid}/"
    for a in soup.select("h1 a[href]"):
        href = a.get("href", "")
        if href.startswith(f"/tests/{tid}/"):
            canonical_path = href
            break
    sol_html = fetch(f"https://study4.com{canonical_path}solutions/", session_id)
    q_sol = parse_solutions(sol_html)

    title_el = soup.find("h1")
    title = legacy_title or f"HSK {level} Practice test"
    if not legacy_title and title_el:
        raw_t = re.sub(r"\s*Thoát\s*$", "", title_el.get_text(" ", strip=True)).strip()
        if raw_t:
            title = raw_t

    tl_el = soup.find("input", attrs={"name": "time_limit"})
    default_mins = {1: 35, 2: 50, 3: 85, 4: 100, 5: 120, 6: 135}
    try:
        minutes = int(float(tl_el.get("value"))) if tl_el else default_mins[level]
    except Exception:
        minutes = default_mins[level]

    top_audio = extract_audio_url(soup.find("div", id="test-content") or soup)
    parts = []
    for tl in soup.select("#pills-tab a.nav-link"):
        href = tl.get("href", "")
        if not href.startswith("#partcontent-"):
            continue
        pid = href.replace("#partcontent-", "").strip()
        pname = tl.get_text(strip=True)
        skill = "listening" if "listen" in pname.lower() else ("writing" if "writ" in pname.lower() else "reading")
        pane = soup.find("div", id=f"partcontent-{pid}")
        if not pane:
            continue
        part_audio = extract_audio_url(pane) or (top_audio if skill == "listening" else "")
        groups = []
        tqw = pane.find("div", class_="test-questions-wrapper")
        if tqw:
            for child in tqw.children:
                if not isinstance(child, Tag):
                    continue
                classes = child.get("class") or []
                if "question-group-wrapper" in classes:
                    grp_ctx = ""
                    grp_audio = ""
                    two_cols = bool(child.find("div", class_="question-twocols"))
                    for cw in child.find_all("div", class_="context-wrapper"):
                        if cw.find_parent("div", class_="question-item-wrapper") is not None:
                            continue
                        aud = extract_audio_url(cw)
                        if aud:
                            grp_audio = aud
                        for cc in cw.find_all("div", class_="context-content"):
                            c_cls = cc.get("class") or []
                            if "context-transcript" in c_cls or "context-audio" in c_cls:
                                continue
                            h = clean_inner_html(cc)
                            if h:
                                grp_ctx = (grp_ctx + " " + h).strip() if grp_ctx else h
                    qs = []
                    grp_trans = ""
                    for item_el in child.find_all("div", class_="question-item-wrapper"):
                        q_obj = parse_question_item(item_el, q_sol)
                        if q_obj:
                            qs.append(q_obj)
                            if not grp_trans:
                                grp_trans = q_sol.get(q_obj["qid"], {}).get("groupTranscriptHtml", "")
                    if qs:
                        g_obj = {"questions": qs}
                        if grp_ctx:
                            g_obj["contextHtml"] = grp_ctx
                        if grp_audio:
                            g_obj["audio"] = grp_audio
                        if grp_trans:
                            g_obj["transcriptHtml"] = grp_trans
                        if two_cols:
                            g_obj["twoCols"] = True
                        groups.append(g_obj)
                elif "question-item-wrapper" in classes:
                    q_obj = parse_question_item(child, q_sol)
                    if q_obj:
                        groups.append({"questions": [q_obj]})
        q_count = sum(len(g["questions"]) for g in groups)
        p_obj = {"id": pid, "name": pname, "skill": skill, "questionCount": q_count, "groups": groups}
        if part_audio:
            p_obj["audio"] = part_audio
        parts.append(p_obj)

    test_obj = {
        "id": str(tid),
        "level": level,
        "title": title,
        "url": legacy_url or f"https://study4.com{canonical_path}",
        "canonicalUrl": f"https://study4.com{canonical_path}",
        "minutes": minutes,
        "listening": sum(p["questionCount"] for p in parts if p["skill"] == "listening"),
        "totalQuestions": sum(p["questionCount"] for p in parts),
        "audio": top_audio,
        "parts": parts
    }
    folder = f"content/study4-audio/hsk{level}/test-{tid}"
    has_q = any(q.get("audio") for p in parts for g in p.get("groups", []) for q in g.get("questions", []))
    if not has_q:
        if top_audio:
            test_obj["audioFile"] = f"{folder}/listening.mp3"
        for p in parts:
            if p.get("audio"):
                p["audioFile"] = f"{folder}/listening.mp3"
    else:
        for p in parts:
            for g in p.get("groups", []):
                q_nums = [q.get("number") for q in g.get("questions", []) if q.get("number")]
                if g.get("audio"):
                    name = f"group-q{q_nums[0]}-q{q_nums[-1]}.mp3" if len(q_nums) > 1 else f"group-q{q_nums[0]}.mp3"
                    g["audioFile"] = f"{folder}/{name}"
                for q in g.get("questions", []):
                    if q.get("audio"):
                        q["audioFile"] = f"{folder}/q{q.get('number')}.mp3"
    return test_obj

def discover_all(session_id):
    found = {}
    for lvl, tid, ltitle, lurl in SEEDS:
        found[tid] = {"id": tid, "level": lvl, "legacyTitle": ltitle, "legacyUrl": lurl}
    for p in range(1, 35):
        html = fetch(f"https://study4.com/tests/?term=hsk&page={p}", session_id)
        matches = re.findall(r'href=["\'](/tests/(\d+)/([^"\'/]+)/)["\']', html)
        new_cnt = 0
        for full, tid, slug in matches:
            m = re.search(r'hsk-([1-6])', slug.lower())
            if m:
                lvl = int(m.group(1))
                if tid not in found:
                    found[tid] = {"id": tid, "level": lvl, "legacyTitle": None, "legacyUrl": None}
                    new_cnt += 1
        if new_cnt == 0:
            break
    return list(found.values())

def main():
    parser = argparse.ArgumentParser(description="Sync all Study4 HSK tests into study4-tests-data.json.gz")
    parser.add_argument("--session", default=os.environ.get("STUDY4_SESSION_ID", ""), help="Study4 sessionid cookie")
    args = parser.parse_args()
    if not args.session:
        print("Error: Provide --session or set STUDY4_SESSION_ID env var.", file=sys.stderr)
        sys.exit(1)
    catalog_items = discover_all(args.session)
    results_by_id = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        future_map = {pool.submit(parse_test, item, args.session): item for item in catalog_items}
        for fut in as_completed(future_map):
            item = future_map[fut]
            t_obj = fut.result()
            if t_obj["totalQuestions"] > 0:
                results_by_id[item["id"]] = t_obj
    ordered = [results_by_id[item["id"]] for item in catalog_items if item["id"] in results_by_id]
    payload = {"schema": 1, "source": "Study4.com", "tests": ordered}
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    (ROOT / "study4-tests-data.json.gz").write_bytes(gzip.compress(raw, compresslevel=9))
    print(f"Synced {len(ordered)} tests to study4-tests-data.json.gz")

if __name__ == "__main__":
    main()
