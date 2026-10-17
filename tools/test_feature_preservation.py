"""Deliberate sabotage regression: AI may not silently drop a protected capability."""
import copy
import importlib.util
import json
from pathlib import Path
from unittest import TestCase, main
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('hs_feature_guard',ROOT/'tools'/'check-feature-preservation.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
baseline=json.loads((ROOT/'tools'/'feature-contract.json').read_text(encoding='utf-8'))
approvals={'schema':1,'approved':[]}


class FeaturePreservationTests(TestCase):
 def test_existing_inventory_present_and_valid(self):
  number, checks=mod.inspect_implementation(baseline)
  self.assertGreaterEqual(number,40)
  self.assertGreaterEqual(checks,130)

 def test_fails_when_ai_silently_deletes_flashcards(self):
  corrupted=copy.deepcopy(baseline)
  corrupted['features']=[f for f in corrupted['features'] if f['id']!='flashcards']
  with self.assertRaisesRegex(ValueError,'FEATURE DELETION BLOCKED: flashcards'):
   mod.ensure_no_unapproved_removals(corrupted,baseline,approvals,['app.js','tools/feature-contract.json'])

 def test_fails_when_ai_weakens_feature_check(self):
  corrupted=copy.deepcopy(baseline)
  old=next(f for f in corrupted['features'] if f['id']=='notebook-factory')
  old['checks'].pop()
  with self.assertRaisesRegex(ValueError,'FEATURE CONTRACT WEAKENED'):
   mod.ensure_no_unapproved_removals(corrupted,baseline,approvals,['notebook-factory.js'])

 def test_fails_when_code_deleted_but_registry_kept(self):
  corrupted=copy.deepcopy(baseline)
  registry=next(f for f in corrupted['features'] if f['id']=='offline-pwa')
  registry['checks'].append({'kind':'contains','file':'offline.js','value':'nonexistent-offline-update-handler-abc'})
  with self.assertRaisesRegex(ValueError,'Existing feature damaged'):
   mod.inspect_implementation(corrupted)

 def test_approval_must_not_be_added_in_same_code_pr(self):
  change={'schema':1,'approved':[{
   'id':'flashcards','approvedBy':'trungxemcode',
   'approvalUrl':'https://github.com/trungxemcode/hsk/issues/1','reason':'Explicitly requested by owner'
  }]}
  with self.assertRaisesRegex(ValueError,'FEATURE DELETION BLOCKED'):
   mod.ensure_no_unapproved_removals(
    {**baseline,'features':[f for f in baseline['features'] if f['id']!='flashcards']},
    baseline,approvals,['tools/approved-feature-removals.json','app.js'])
  with self.assertRaisesRegex(ValueError,'SEPARATE approval-only PR'):
   mod.ensure_no_unapproved_removals(baseline,baseline,approvals,
                                    ['tools/approved-feature-removals.json','app.js'])
  self.assertEqual(len(mod.parse_approvals(change)),1)

 def test_previously_approved_deletion_can_pass_separate_followup(self):
  approved={'schema':1,'approved':[{
   'id':'flashcards','approvedBy':'trungxemcode',
   'approvalUrl':'https://github.com/trungxemcode/hsk/pull/100',
   'reason':'Feature owner specifically requested its removal'
  }]}
  removed=copy.deepcopy(baseline)
  removed['features']=[x for x in removed['features'] if x['id']!='flashcards']
  self.assertEqual(mod.ensure_no_unapproved_removals(removed,baseline,approved,['app.js']),len(baseline['features']))

 def test_new_practice_mode_needs_contract(self):
  damaged=copy.deepcopy(baseline)
  feature=next(f for f in damaged['features'] if f['id']=='real-reading')
  feature['checks']=[c for c in feature['checks'] if not (
    c['file']=='practice-selector.js' and c['value']=="['real-reading'")]
  with self.assertRaisesRegex(ValueError,'New/unprotected practice mode'):
   mod.inspect_implementation(damaged)

 def test_new_route_needs_contract(self):
  damaged=copy.deepcopy(baseline)
  feature=next(f for f in damaged['features'] if f['id']=='admin-dashboard')
  feature['checks']=[c for c in feature['checks'] if c['kind']!='data_go']
  with self.assertRaisesRegex(ValueError,'New/unprotected navigation route'):
   mod.inspect_implementation(damaged)

 def test_only_full_contract_entries_allowed(self):
  wrong=copy.deepcopy(baseline)
  wrong['features'][0]['checks']=[]
  with self.assertRaisesRegex(ValueError,'Missing implementation'):
   mod.validate_contract(wrong)
  wrong=copy.deepcopy(baseline)
  wrong['features'][0]['checks'][0]['file']='../private-key'
  with self.assertRaisesRegex(ValueError,'Unsafe source'):
   mod.validate_contract(wrong)

 def test_baseline_is_append_only_without_approval(self):
  extended=copy.deepcopy(baseline)
  extended['features'].append({'id':'new-feature','name':'Additive','checks':[{'kind':'file','file':'studio.js','value':''}]})
  self.assertEqual(mod.ensure_no_unapproved_removals(extended,baseline,approvals,['new-feature.js']),len(baseline['features']))

 def test_approval_changes_are_only_separate_pull_requests(self):
  self.assertEqual(mod.ensure_no_unapproved_removals(baseline,baseline,approvals,[mod.APPROVALS]),len(baseline['features']))
  with self.assertRaisesRegex(ValueError,'SEPARATE'):
   mod.ensure_no_unapproved_removals(baseline,baseline,approvals,[mod.APPROVALS,'docs/ai/notes.md'])


if __name__=='__main__':
 main()
