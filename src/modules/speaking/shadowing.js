/* Interactive Shadowing + Real-time Tone Pitch Contour modal for lessons, words and dialogues. */
(function (root) {
  'use strict';

  const MIC_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4M9 21h6"/></svg>';

  let activeModal = null;

  function el(tag, text, cls) {
    const n = document.createElement(tag);
    if (text !== undefined && text !== null) n.textContent = text;
    if (cls) n.className = cls;
    if (tag === 'button') {
      n.type = 'button';
      n.dataset.uiOwned = '1';
    }
    return n;
  }

  function cleanText(text) {
    return String(text || '')
      .replace(/^\s*[A-Za-z0-9\u4e00-\u9fff]{1,6}\s*[:：]\s*/, '')
      .trim();
  }

  function drawPitchChart(canvas, syllables, result) {
    const ctx = canvas.getContext?.('2d');
    if (!ctx || typeof ctx.beginPath !== 'function') return;

    const dpr = Math.max(1, Math.min(2, root.devicePixelRatio || 1));
    const width = Math.max(280, Math.round(canvas.clientWidth || 560));
    const height = Math.max(150, Math.round(canvas.clientHeight || 176));
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const style = root.getComputedStyle(canvas);
    const ink = style.getPropertyValue('--ink').trim() || '#1e1b4b';
    const sub = style.getPropertyValue('--muted').trim() || '#64748b';
    const line = style.getPropertyValue('--line').trim() || '#e2e8f0';
    const accent = style.getPropertyValue('--accent').trim() || '#5b4be8';
    const isDark = document.documentElement.dataset.theme === 'dark';
    const okColor = isDark ? '#4ade80' : '#16a34a';
    const warnColor = isDark ? '#fbbf24' : '#d97706';

    const padL = 24;
    const padR = 10;
    const padT = 26;
    const padB = 18;
    const plotW = Math.max(120, width - padL - padR);
    const plotH = Math.max(80, height - padT - padB);
    const chaoToY = chao => padT + ((5 - Math.max(1, Math.min(5, chao))) / 4) * plotH;

    // Draw Chao 5-level horizontal gridlines.
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let lv = 1; lv <= 5; lv++) {
      const y = chaoToY(lv);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = sub;
      ctx.fillText(String(lv), padL - 6, y);
    }

    const core = root.HSKPitchCore;
    const cols = result?.syllables?.length
      ? result.syllables
      : (syllables || []).map(s => ({
          ...s,
          target: core?.targetContour(s.spokenTone, 12, s.isFinal) || [],
          userContour: [],
          detectedTone: 0,
          score: 0
        }));

    if (!cols.length) {
      ctx.restore();
      return;
    }

    const colW = plotW / cols.length;
    const insetX = Math.min(12, colW * 0.14);

    cols.forEach((col, i) => {
      const x0 = padL + i * colW;
      if (i > 0) {
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, padT - 18);
        ctx.lineTo(x0, height - padB);
        ctx.stroke();
      }

      // Header Hanzi + Pinyin
      ctx.fillStyle = ink;
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${col.han}${col.pinyin ? ' ' + col.pinyin : ''}`, x0 + colW / 2, 4, colW - 4);

      const drawSpan = Math.max(16, colW - insetX * 2);
      const startX = x0 + insetX;

      // Dotted canonical target contour
      if (col.target?.length) {
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        col.target.forEach((v, idx) => {
          const px = startX + (idx / Math.max(1, col.target.length - 1)) * drawSpan;
          const py = chaoToY(v);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
      }

      // Learner's actual pitch contour
      if (col.userContour?.length) {
        const matched = col.spokenTone === 5 || col.detectedTone === col.spokenTone;
        ctx.save();
        ctx.strokeStyle = matched ? okColor : warnColor;
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        col.userContour.forEach((v, idx) => {
          const px = startX + (idx / Math.max(1, col.userContour.length - 1)) * drawSpan;
          const py = chaoToY(v);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
      }
    });

    ctx.restore();
  }

  function closeActive() {
    if (activeModal) activeModal.close();
  }

  function open(opts = {}) {
    closeActive();

    const text = cleanText(opts.text || '');
    if (!text) return null;
    const pinyin = String(opts.pinyin || '').trim();
    const meaning = String(opts.meaning || '').trim();
    const priorFocus = document.activeElement;

    const core = root.HSKPitchCore;
    const recorder = root.HSKRecorder;
    const syllables = core ? core.parseSyllables(text, pinyin) : [];
    const maxMs = Math.max(5500, Math.min(20000, 3500 + syllables.length * 1400));

    const dialog = el('dialog', undefined, 'speaking-modal');
    dialog.setAttribute('aria-label', 'Luyện nói và kiểm tra thanh điệu');

    const head = el('div', undefined, 'speaking-modal-head');
    const titleBox = el('div');
    const targetP = el('p', text, 'speaking-target-han');
    titleBox.append(
      el('p', 'Luyện nói & kiểm tra thanh điệu', 'speaking-eyebrow'),
      targetP
    );
    if (meaning) titleBox.append(el('p', meaning, 'speaking-target-mean'));

    const closeBtn = el('button', 'Đóng', 'speaking-close-btn');
    head.append(titleBox, closeBtn);

    const sylStrip = el('div', undefined, 'speaking-syllable-strip');
    const sandhiNotes = [];
    for (const s of syllables) {
      const chip = el('div', undefined, 'speaking-syl-chip' + (s.sandhiNote ? ' has-sandhi' : ''));
      const toneLabel = s.spokenTone !== s.baseTone
        ? `T${s.baseTone}→T${s.spokenTone}`
        : `Thanh ${s.spokenTone}`;
      chip.append(el('strong', s.han), el('small', `${s.pinyin || '—'} · ${toneLabel}`));
      sylStrip.append(chip);
      if (s.sandhiNote) sandhiNotes.push(`${s.han}: ${s.sandhiNote}`);
    }

    const controls = el('div', undefined, 'speaking-controls');
    const sampleBtn = el('button', '▶ Nghe mẫu');
    const recordBtn = el('button', '● Bắt đầu thu', 'speaking-record-btn');
    const replayBtn = el('button', '▶ Giọng mình');
    const compareBtn = el('button', '⇄ Đối chiếu');
    replayBtn.disabled = true;
    compareBtn.disabled = true;
    controls.append(sampleBtn, recordBtn, replayBtn, compareBtn);

    const liveBar = el('div', undefined, 'speaking-live-bar');
    const statusRow = el('div', undefined, 'speaking-status-row');
    const statusText = el('span', 'Bấm "▶ Nghe mẫu" hoặc "● Bắt đầu thu" để đọc theo.');
    const timerText = el('span', `0.0s / ${(maxMs / 1000).toFixed(0)}s`, 'speaking-timer');
    const meterTrack = el('div', undefined, 'speaking-meter-track');
    const meterFill = el('div', undefined, 'speaking-meter-fill');
    meterTrack.append(meterFill);
    statusRow.append(statusText, timerText);
    liveBar.append(statusRow, meterTrack);

    const chartWrap = el('div', undefined, 'speaking-chart-wrap');
    const legend = el('div', undefined, 'speaking-chart-legend');
    legend.append(
      el('span', 'Đường nét đứt tím: quỹ đạo chuẩn (thang 1–5)'),
      el('span', 'Nét liền: giọng của bạn')
    );
    const canvas = el('canvas', undefined, 'speaking-pitch-canvas');
    canvas.setAttribute('aria-label', 'Biểu đồ đường cao độ thanh điệu');
    chartWrap.append(legend, canvas);

    const resultBox = el('div', undefined, 'speaking-result-box');
    resultBox.hidden = true;

    const foot = el('div', undefined, 'speaking-modal-foot');
    const footNote = el('span', 'Chấm thanh điệu 0đ trên máy (MPM + DTW).');
    const footActions = el('div', undefined, 'speaking-foot-actions');
    const packBtn = el('button', '⬇ Tải gói nhận diện Offline', 'speaking-pack-btn');
    const clearBtn = el('button', 'Xóa bản ghi trên máy', 'speaking-clear-btn');
    footActions.append(packBtn, clearBtn);
    foot.append(footNote, footActions);

    const formatBytes = n => {
      if (!n || n <= 0) return '0 B';
      if (n < 1048576) return `${Math.max(1, Math.round(n / 1024))} KiB`;
      return `${(n / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MiB`;
    };

    async function refreshStorageControls() {
      if (closed) return;
      const pack = recorder?.offlinePack;
      if (pack) {
        const info = await pack.downloaded().catch(() => ({ installed: false, bytes: 0, busy: false }));
        if (closed) return;
        if (info.busy) {
          packBtn.textContent = 'Hủy tải gói Offline';
          packBtn.classList.remove('is-installed');
        } else if (info.installed) {
          packBtn.textContent = `🗑 Xóa gói Offline (${formatBytes(info.bytes)})`;
          packBtn.classList.add('is-installed');
        } else {
          packBtn.textContent = '⬇ Tải gói nhận diện Offline (~10,8 MiB)';
          packBtn.classList.remove('is-installed');
        }
      } else {
        packBtn.hidden = true;
      }

      if (recorder?.usage) {
        const recBytes = await recorder.usage().catch(() => 0);
        if (closed) return;
        clearBtn.textContent = recBytes > 0 ? `Xóa bản ghi (${formatBytes(recBytes)})` : 'Chưa có bản ghi';
        clearBtn.disabled = recBytes <= 0;
      }
    }

    dialog.append(head);
    if (syllables.length) dialog.append(sylStrip);
    if (sandhiNotes.length) dialog.append(el('p', sandhiNotes.join(' · '), 'speaking-sandhi-note'));
    dialog.append(controls, liveBar, chartWrap, resultBox, foot);
    document.body.append(dialog);

    let closed = false;
    let recordingSession = null;
    let lastRecording = null;
    let lastResult = null;
    let userAudio = null;
    let userAudioUrl = '';
    let compareToken = 0;
    let compareMode = false;
    let onSampleDone = null;
    let onSampleError = null;

    const samplePlayer = root.HSKSpeech?.createPlayer
      ? root.HSKSpeech.createPlayer({
          synth: root.speechSynthesis,
          Utterance: root.SpeechSynthesisUtterance,
          rate: 0.82,
          notify: msg => {
            if (closed) return;
            if (msg === 'Đã nghe xong.') {
              const cb = onSampleDone;
              onSampleDone = null;
              onSampleError = null;
              if (cb) cb();
              else statusText.textContent = 'Đã phát xong giọng mẫu.';
            } else if (msg.startsWith('Đang phát âm')) {
              if (!compareMode) statusText.textContent = 'Đang phát giọng mẫu…';
            } else {
              const errCb = onSampleError;
              onSampleDone = null;
              onSampleError = null;
              if (errCb) errCb(msg);
              else statusText.textContent = msg;
            }
          }
        })
      : null;

    function stopPlayback() {
      compareToken++;
      compareMode = false;
      onSampleDone = null;
      onSampleError = null;
      samplePlayer?.stop?.();
      if (userAudio) {
        try { userAudio.pause(); } catch {}
        userAudio.onended = null;
        userAudio.onerror = null;
        userAudio = null;
      }
    }

    function playLearnerAudio(url) {
      return new Promise((resolve, reject) => {
        if (!url || typeof root.Audio !== 'function') {
          reject(Error('Trình duyệt chưa hỗ trợ phát lại file ghi âm.'));
          return;
        }
        const a = new root.Audio(url);
        userAudio = a;
        a.onended = () => { if (userAudio === a) userAudio = null; resolve(true); };
        a.onerror = () => { if (userAudio === a) userAudio = null; reject(Error('Không phát được bản ghi âm.')); };
        try {
          const p = a.play();
          if (p && typeof p.catch === 'function') p.catch(reject);
        } catch (err) {
          reject(err);
        }
      });
    }

    function renderAnalysis(recording, scoreResult) {
      lastResult = scoreResult;
      drawPitchChart(canvas, syllables, scoreResult);
      resultBox.replaceChildren();
      resultBox.hidden = false;

      const scoreHead = el('div', undefined, 'speaking-score-head');
      const toneClass = !scoreResult.hasVoice ? 'is-warn' : scoreResult.overallScore >= 75 ? 'is-good' : 'is-warn';
      const pill = el('span', scoreResult.hasVoice ? `Độ khớp: ${scoreResult.overallScore}%` : 'Chưa rõ giọng', 'speaking-score-pill ' + toneClass);
      scoreHead.append(el('strong', scoreResult.summaryVi), pill);
      resultBox.append(scoreHead);

      if (recording.transcript) {
        const matchNote = scoreResult.charMatch ? ` · Khớp chữ: ${scoreResult.charMatch.matchRatio}%` : '';
        resultBox.append(el('p', `Nhận diện giọng nói: “${recording.transcript}”${matchNote}`, 'speaking-transcript'));
      } else if (!recording.recognitionSupported) {
        resultBox.append(el('p', 'Trình duyệt này đang chạy ở chế độ phân tích cao độ 4 thanh offline (không hỗ trợ chuyển giọng thành chữ).', 'speaking-transcript'));
      }

      if (scoreResult.syllables?.length) {
        const ul = el('ul', undefined, 'speaking-feedback-list');
        for (const syl of scoreResult.syllables) {
          const ok = syl.spokenTone === 5 ? syl.hasVoice !== false && syl.detectedTone > 0 : syl.detectedTone === syl.spokenTone;
          const li = el('li', undefined, 'speaking-feedback-item ' + (ok ? 'is-ok' : 'is-warn'));
          const detectedLabel = syl.detectedTone ? (core?.TONE_SHORT[syl.detectedTone] || `T${syl.detectedTone}`) : 'Chưa rõ';
          li.append(
            el('strong', `${syl.han}${syl.pinyin ? ' (' + syl.pinyin + ')' : ''}`),
            el('span', syl.feedbackVi),
            el('small', `${detectedLabel} · ${syl.score}%`)
          );
          ul.append(li);
        }
        resultBox.append(ul);
      }
    }

    function finishRecording(recording) {
      recordBtn.textContent = '● Thu lại';
      recordBtn.classList.remove('is-recording');
      recordBtn.setAttribute('aria-pressed', 'false');
      meterFill.style.width = '0%';
      recordingSession = null;

      if (!recording) return;
      lastRecording = recording;
      if (userAudioUrl && root.URL?.revokeObjectURL) {
        try { root.URL.revokeObjectURL(userAudioUrl); } catch {}
      }
      userAudioUrl = root.URL?.createObjectURL ? root.URL.createObjectURL(recording.wavBlob) : '';
      replayBtn.disabled = !userAudioUrl;
      compareBtn.disabled = !userAudioUrl;

      const scoreResult = core
        ? core.segmentAndScore({
            samples: recording.pcm,
            sampleRate: recording.sampleRate,
            text,
            pinyin,
            transcript: recording.transcript
          })
        : { hasVoice: false, overallScore: 0, syllables: [], summaryVi: 'Thiếu bộ phân tích cao độ.' };

      statusText.textContent = scoreResult.hasVoice
        ? 'Đã phân tích xong. Bạn có thể bấm "⇄ Đối chiếu" để nghe so sánh với mẫu.'
        : 'Chưa thu đủ tín hiệu giọng nói. Thử thu lại gần micro hơn.';
      timerText.textContent = `${(recording.durationMs / 1000).toFixed(1)}s`;
      renderAnalysis(recording, scoreResult);

      if (recorder?.saveRecording && scoreResult.hasVoice) {
        recorder.saveRecording({
          text,
          pinyin,
          overallScore: scoreResult.overallScore,
          transcript: recording.transcript,
          durationMs: recording.durationMs,
          wavBlob: recording.wavBlob
        }).then(() => refreshStorageControls()).catch(() => {});
      } else {
        void refreshStorageControls();
      }
    }

    sampleBtn.onclick = () => {
      stopPlayback();
      if (!samplePlayer) {
        statusText.textContent = 'Thiết bị chưa hỗ trợ phát giọng mẫu.';
        return;
      }
      samplePlayer.play(text);
    };

    recordBtn.onclick = async () => {
      if (recordingSession) {
        const s = recordingSession;
        recordingSession = null;
        statusText.textContent = 'Đang phân tích thanh điệu…';
        const res = await s.stop().catch(() => null);
        if (!closed) finishRecording(res);
        return;
      }

      if (!recorder?.isSupported()) {
        statusText.textContent = 'Trình duyệt này chưa hỗ trợ thu âm Web Audio API.';
        return;
      }

      stopPlayback();
      try {
        statusText.textContent = 'Đang mở micro… Hãy đọc rõ từng chữ.';
        recordBtn.textContent = '■ Dừng thu';
        recordBtn.classList.add('is-recording');
        recordBtn.setAttribute('aria-pressed', 'true');
        recordingSession = await recorder.start({
          maxMs,
          lang: 'zh-CN',
          onLevel: (rms, elapsedMs) => {
            if (closed) return;
            const pct = Math.max(4, Math.min(100, Math.round(rms * 420)));
            meterFill.style.width = pct + '%';
            timerText.textContent = `${(elapsedMs / 1000).toFixed(1)}s / ${(maxMs / 1000).toFixed(0)}s`;
          },
          onTranscript: txt => {
            if (!closed && txt) statusText.textContent = `Đang nghe: “${txt}”`;
          },
          onAutoStop: res => {
            if (!closed && res) finishRecording(res);
          }
        });
      } catch (err) {
        recordingSession = null;
        recordBtn.textContent = '● Bắt đầu thu';
        recordBtn.classList.remove('is-recording');
        recordBtn.setAttribute('aria-pressed', 'false');
        meterFill.style.width = '0%';
        statusText.textContent = err?.message || 'Không thể bắt đầu thu âm.';
      }
    };

    replayBtn.onclick = async () => {
      if (!userAudioUrl) return;
      stopPlayback();
      statusText.textContent = 'Đang phát lại giọng của bạn…';
      try {
        await playLearnerAudio(userAudioUrl);
        if (!closed) statusText.textContent = 'Đã phát xong giọng của bạn.';
      } catch (err) {
        if (!closed) statusText.textContent = err?.message || 'Không phát được giọng ghi âm.';
      }
    };

    compareBtn.onclick = async () => {
      if (!userAudioUrl) return;
      stopPlayback();
      const runId = ++compareToken;
      compareMode = true;
      statusText.textContent = 'Đối chiếu (1/2): Đang phát giọng mẫu…';

      if (samplePlayer) {
        await new Promise(resolve => {
          const fallback = setTimeout(resolve, 6500);
          onSampleDone = () => { clearTimeout(fallback); resolve(); };
          onSampleError = () => { clearTimeout(fallback); resolve(); };
          samplePlayer.play(text);
        });
        if (closed || runId !== compareToken) return;
        await new Promise(r => setTimeout(r, 350));
        if (closed || runId !== compareToken) return;
      }

      statusText.textContent = 'Đối chiếu (2/2): Đang phát giọng của bạn…';
      try {
        await playLearnerAudio(userAudioUrl);
        if (!closed && runId === compareToken) {
          compareMode = false;
          statusText.textContent = 'Đã nghe xong đối chiếu mẫu và giọng bạn.';
        }
      } catch (err) {
        compareMode = false;
        if (!closed && runId === compareToken) statusText.textContent = err?.message || 'Không phát được bản thu.';
      }
    };

    packBtn.onclick = async () => {
      const pack = recorder?.offlinePack;
      if (!pack) return;
      if (pack.busy) {
        pack.cancelInstall();
        statusText.textContent = 'Đã hủy tải gói nhận diện Offline.';
        await refreshStorageControls();
        return;
      }
      const info = await pack.downloaded().catch(() => ({ installed: false, bytes: 0 }));
      if (info.installed) {
        await pack.remove();
        statusText.textContent = `Đã xóa gói nhận diện Offline (${formatBytes(info.bytes)}) để giải phóng dung lượng.`;
        await refreshStorageControls();
        return;
      }
      if (!root.navigator?.onLine) {
        statusText.textContent = 'Cần kết nối mạng để tải gói nhận diện Offline lần đầu.';
        return;
      }
      statusText.textContent = 'Đang tải gói nhận diện giọng nói Offline (~10,8 MiB)…';
      try {
        const res = await pack.install(p => {
          if (closed) return;
          if (p.total) {
            const pct = Math.round((p.loaded / p.total) * 100);
            packBtn.textContent = `Đang tải ${pct}% · Hủy`;
          }
        });
        if (!closed) {
          statusText.textContent = `Đã tải xong gói Offline (${formatBytes(res.bytes)}). Có thể xóa bất cứ lúc nào khi không dùng.`;
          await refreshStorageControls();
        }
      } catch (err) {
        if (!closed) {
          statusText.textContent = err?.name === 'AbortError'
            ? 'Đã hủy tải gói nhận diện Offline.'
            : (err?.message || 'Không tải được gói nhận diện Offline.');
          await refreshStorageControls();
        }
      }
    };

    clearBtn.onclick = async () => {
      await recorder?.clearRecordings?.();
      if (!closed) {
        statusText.textContent = 'Đã xóa toàn bộ bản ghi âm giọng nói lưu trên máy.';
        await refreshStorageControls();
      }
    };

    const onPackChanged = () => { void refreshStorageControls(); };
    root.addEventListener('hsk-speaking-pack-changed', onPackChanged);

    function close() {
      if (closed) return;
      closed = true;
      stopPlayback();
      if (recordingSession) {
        recordingSession.cancel().catch(() => {});
        recordingSession = null;
      }
      if (userAudioUrl && root.URL?.revokeObjectURL) {
        try { root.URL.revokeObjectURL(userAudioUrl); } catch {}
        userAudioUrl = '';
      }
      root.removeEventListener('pagehide', close);
      root.removeEventListener('hashchange', close);
      root.removeEventListener('hsk-speaking-pack-changed', onPackChanged);
      dialog.removeEventListener('cancel', onCancel);
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      dialog.remove();
      if (activeModal?.close === close) activeModal = null;
      if (priorFocus?.isConnected && typeof priorFocus.focus === 'function') {
        priorFocus.focus({ preventScroll: true });
      }
    }

    function onCancel(e) {
      e.preventDefault();
      close();
    }

    closeBtn.onclick = close;
    dialog.addEventListener('cancel', onCancel);
    root.addEventListener('pagehide', close);
    root.addEventListener('hashchange', close);

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');

    drawPitchChart(canvas, syllables, lastResult);
    void refreshStorageControls();
    root.requestAnimationFrame?.(() => {
      if (!closed) drawPitchChart(canvas, syllables, lastResult);
    });

    activeModal = { close };
    return activeModal;
  }

  function button(opts = {}) {
    const compact = Boolean(opts.compact);
    const b = el('button', undefined, 'speaking-practice-btn' + (compact ? ' is-compact' : ''));
    b.innerHTML = MIC_SVG + `<span>${compact ? 'Nói' : 'Luyện nói'}</span>`;
    const target = cleanText(opts.text || '');
    b.title = 'Thu âm & kiểm tra thanh điệu' + (target ? ': ' + target : '');
    b.setAttribute('aria-label', 'Luyện nói & kiểm tra thanh điệu' + (target ? ' ' + target : ''));
    b.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      opts.onOpen?.();
      open(opts);
    });
    return b;
  }

  root.HSKSpeaking = {
    open,
    button,
    close: closeActive
  };
})(typeof window === 'object' ? window : globalThis);
