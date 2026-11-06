'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const script=path.resolve(__dirname,'sync-ai-tutor-after-squash.sh');

function git(cwd,...args){
  return cp.execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}
function setup(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hsk-squash-sync-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const remote=path.join(dir,'origin.git'),local=path.join(dir,'work');
  fs.mkdirSync(remote);
  git(remote,'init','--bare','--initial-branch=main');
  git(dir,'clone',remote,local);
  git(local,'config','user.name','Test User');
  git(local,'config','user.email','test@example.invalid');
  fs.writeFileSync(path.join(local,'base.txt'),'base\n');
  git(local,'add','.');
  git(local,'commit','-m','base');
  git(local,'push','origin','HEAD:main');
  git(local,'switch','-c','feat/ai-tutor-v5-hardening');
  fs.writeFileSync(path.join(local,'v5.txt'),'AI Tutor V5\n');
  git(local,'add','.');
  git(local,'commit','-m','feature content');
  const mergedHead=git(local,'rev-parse','HEAD');
  git(local,'push','origin','HEAD:feat/ai-tutor-v5-hardening');
  git(local,'switch','main');
  git(local,'restore','--source=feat/ai-tutor-v5-hardening','--','v5.txt');
  git(local,'add','.');
  git(local,'commit','-m','squash copy');
  const squash=git(local,'rev-parse','HEAD');
  git(local,'push','origin','HEAD:main');
  git(local,'switch','feat/ai-tutor-v5-hardening');
  fs.writeFileSync(path.join(local,'new-work.txt'),'keep this new work\n');
  git(local,'add','.');
  git(local,'commit','-m','work after squash');
  git(local,'push','origin','HEAD:feat/ai-tutor-v5-hardening');
  return {remote,local,mergedHead,squash};
}
function run(s){
  return cp.spawnSync('bash',[script],{
    cwd:s.local,encoding:'utf8',
    env:{...process.env,AI_TUTOR_MERGED_HEAD:s.mergedHead,AI_TUTOR_SQUASH_SHA:s.squash,AI_TUTOR_PR_NUMBER:'310'}
  });
}

test('attaches the exact squash commit, preserves new work, and is idempotent',t=>{
  const s=setup(t),before=git(s.local,'rev-parse','refs/remotes/origin/feat/ai-tutor-v5-hardening^{tree}');
  const result=run(s);
  assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
  git(s.local,'fetch','origin');
  const head=git(s.local,'rev-parse','refs/remotes/origin/feat/ai-tutor-v5-hardening');
  assert.equal(git(s.local,'rev-parse',head+'^{tree}'),before);
  assert.equal(git(s.local,'show',head+':new-work.txt'),'keep this new work');
  git(s.local,'merge-base','--is-ancestor',s.squash,head);
  assert.equal(run(s).status,0);
  git(s.local,'fetch','origin');
  assert.equal(git(s.local,'rev-parse','refs/remotes/origin/feat/ai-tutor-v5-hardening'),head);
});

test('recreates an auto-deleted merged branch from main without overwriting commits',t=>{
  const s=setup(t);
  git(s.remote,'update-ref','refs/pull/310/head',s.mergedHead);
  git(s.remote,'update-ref','-d','refs/heads/feat/ai-tutor-v5-hardening');
  const fresh=path.join(path.dirname(s.local),'fresh');
  git(path.dirname(s.local),'clone','--branch','main',s.remote,fresh);
  const result=run({...s,local:fresh});
  assert.equal(result.status,0,result.stderr+'\\n'+result.stdout);
  const recreated=git(fresh,'ls-remote','origin','refs/heads/feat/ai-tutor-v5-hardening').slice(0,40);
  assert.equal(recreated,git(fresh,'rev-parse','origin/main'));
});

test('refuses to attach a squash commit with different source content',t=>{
  const s=setup(t);
  git(s.local,'switch','main');
  fs.writeFileSync(path.join(s.local,'unrelated.txt'),'different\n');
  git(s.local,'add','.');
  git(s.local,'commit','-m','unrelated change');
  const unsafe=git(s.local,'rev-parse','HEAD');
  git(s.local,'push','origin','HEAD:main');
  const before=git(s.local,'rev-parse','refs/remotes/origin/feat/ai-tutor-v5-hardening');
  const result=run({...s,squash:unsafe});
  assert.notEqual(result.status,0);
  git(s.local,'fetch','origin');
  assert.equal(git(s.local,'rev-parse','refs/remotes/origin/feat/ai-tutor-v5-hardening'),before);
});

test('does not overwrite a feature branch replaced after the PR was merged',t=>{
  const s=setup(t);
  git(s.local,'switch','main');
  git(s.local,'push','origin','main:refs/heads/feat/ai-tutor-v5-hardening','--force');
  const before=git(s.local,'ls-remote','origin','refs/heads/feat/ai-tutor-v5-hardening').split(/\s+/)[0];
  const result=run(s);
  assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
  assert.equal(git(s.local,'ls-remote','origin','refs/heads/feat/ai-tutor-v5-hardening').split(/\s+/)[0],before);
});

test('workflow uses a trusted base-branch checkout and narrow merged-PR guard',()=>{
  const y=fs.readFileSync(path.join(__dirname,'../.github/workflows/ai-tutor-branch-sync.yml'),'utf8');
  assert.match(y,/pull_request_target:/);
  assert.match(y,/schedule:/);
  assert.match(y,/restore-missing-branch:/);
  assert.match(y,/types:\s*\[closed\]/);
  assert.match(y,/head\.repo\.full_name == github\.repository/);
  assert.match(y,/pull_request\.merged == true/);
  assert.match(y,/ref:\s*\$\{\{ github\.event\.repository\.default_branch \}\}/);
  assert.doesNotMatch(y,/pull_request\.head\.sha\s*\}\}\s*\n\s*fetch-depth/);
});

test('UI font install is cached and has a finite step timeout',()=>{
  const y=fs.readFileSync(path.join(__dirname,'../.github/workflows/ui-outside-scope.yml'),'utf8');
  assert.match(y,/uses: actions\/cache@v4/);
  assert.match(y,/timeout-minutes: 4/);
  assert.match(y,/timeout 90s sudo apt-get update/);
  assert.match(y,/timeout 120s sudo env DEBIAN_FRONTEND/);
});
