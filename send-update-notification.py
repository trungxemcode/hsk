"""Notify only opted-in devices after the exact web version is live."""
import json
import os
import time
import urllib.error
import urllib.request
from urllib.parse import urlencode
import uuid
from pathlib import Path

SITE = 'https://trungxemcode.github.io/hsk/'

# Pages caches static JSON for up to 600 seconds. Each attempt must use a
# distinct URL or an early stale response can be cached for the entire loop.
# Pages deployments sometimes exceed five minutes under GitHub Actions load.
# Poll for up to 8.5 minutes, leaving 90 seconds of the 10-minute job
# for startup and OneSignal delivery. Never notify before exact release is live.
PAGES_DEPLOY_WAIT_BUDGET_SECONDS = 510
PAGES_DEPLOY_POLL_SECONDS = 10
PAGES_MANIFEST_REQUEST_TIMEOUT_SECONDS = 10


def live_manifest_url(version, attempt):
    return SITE + 'app-version.json?' + urlencode({
        'release': version, 'attempt': attempt, 'probe': time.time_ns(),
    })



def wait_for_live_version(version):
    deadline = time.monotonic() + PAGES_DEPLOY_WAIT_BUDGET_SECONDS
    attempt = 0
    while True:
        try:
            request = urllib.request.Request(live_manifest_url(version, attempt), headers={
                'Cache-Control': 'no-cache', 'Pragma': 'no-cache',
            })
            timeout = min(PAGES_MANIFEST_REQUEST_TIMEOUT_SECONDS, max(1, deadline - time.monotonic()))
            with urllib.request.urlopen(request, timeout=timeout) as response:
                live = json.load(response)
            if live.get('version') == version:
                return
        except (urllib.error.URLError, TimeoutError, ValueError):
            pass
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise SystemExit('Live version differs: refusing premature/stale update notification.')
        time.sleep(min(PAGES_DEPLOY_POLL_SECONDS, remaining))
        attempt += 1


def payload(app_id, manifest):
    return {
        'app_id': app_id, 'target_channel': 'push',
        'headings': {'en': 'HSK · Có phiên bản mới'},
        'contents': {'en': ('' if manifest['label'].startswith('Bản ') else 'Bản ') + manifest['label'] + ' đã sẵn sàng. Mở app để cập nhật; tiến độ được giữ.'},
        'url': SITE + '?update=1',
        'filters': [{'field': 'tag', 'key': 'hsk_update_on', 'relation': '=', 'value': '1'}],
        'idempotency_key': str(uuid.uuid5(uuid.NAMESPACE_URL, app_id + '/web-update/' + manifest['version'])),
        'ttl': 86400,
    }


def main():
    app_id = os.environ.get('ONESIGNAL_APP_ID', '')
    key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
    if not app_id or not key:
        raise SystemExit('OneSignal secrets missing: update push cannot be sent.')
    manifest = json.loads(Path('app-version.json').read_text())
    try:
        # Native Pages deployments do not reliably emit a workflow_run to user workflows.
        # Wait for the deployed manifest rather than notifying from an unverified push.
        wait_for_live_version(manifest['version'])
        request = urllib.request.Request('https://api.onesignal.com/notifications?c=push',
            data=json.dumps(payload(app_id, manifest)).encode(),
            headers={'Authorization': 'Key ' + key, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=25) as response:
            result = json.load(response)
        errors = result.get('errors') or []
        no_audience = errors in (['All included players are not subscribed'], ['All included subscriptions are not subscribed'])
        if errors and not no_audience:
            raise SystemExit('OneSignal rejected update notification; check dashboard configuration.')
        print('Update notification accepted.' if result.get('id') else 'No opted-in update devices yet.')
    except urllib.error.HTTPError as error:
        raise SystemExit('Update notification failed: HTTP ' + str(error.code)) from None
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
        raise SystemExit('Update notification failed: could not verify release or contact push service.') from None


if __name__ == '__main__':
    main()
