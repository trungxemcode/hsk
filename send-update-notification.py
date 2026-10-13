"""Notify only opted-in devices after the exact web version is live."""
import json
import os
import urllib.error
import urllib.request
import uuid
from pathlib import Path

SITE = 'https://trungxemcode.github.io/hsk/'


def payload(app_id, manifest):
    return {
        'app_id': app_id, 'target_channel': 'push',
        'headings': {'en': 'HSK · Có phiên bản mới'},
        'contents': {'en': 'Bản ' + manifest['label'] + ' đã sẵn sàng. Mở app để cập nhật; tiến độ được giữ.'},
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
        with urllib.request.urlopen(SITE + 'app-version.json?release=' + manifest['version'], timeout=25) as response:
            live = json.load(response)
        if live['version'] != manifest['version']:
            raise SystemExit('Live version differs: refusing premature/stale update notification.')
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
