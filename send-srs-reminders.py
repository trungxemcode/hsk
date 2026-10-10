"""Hourly OneSignal reminder, using GitHub Secrets, never a public API key."""
import datetime
import json
import os
import urllib.error
import urllib.request
import uuid


def payload(app_id, now):
    hour = (now + datetime.timedelta(hours=7)).hour
    return {
        'app_id': app_id, 'target_channel': 'push',
        'headings': {'en': 'HSK · Đến giờ ôn từ'},
        'contents': {'en': 'Có từ đã đến hạn ôn. Mở app để ôn lại và giữ nhớ lâu hơn.'},
        'url': 'https://trungxemcode.github.io/hsk/?mode=srs',
        'filters': [
            {'field': 'tag', 'key': 'hsk_push_on', 'relation': '=', 'value': '1'},
            {'field': 'tag', 'key': 'hsk_remind_hour', 'relation': '=', 'value': str(hour)},
            {'field': 'tag', 'key': 'hsk_due_at', 'relation': '<', 'value': str(int(now.timestamp())+1)},
        ],
        'idempotency_key': str(uuid.uuid5(uuid.NAMESPACE_URL, app_id + now.strftime('/%Y-%m-%d/%H'))),
    }


def main():
    app_id = os.environ.get('ONESIGNAL_APP_ID', '')
    key = os.environ.get('ONESIGNAL_REST_API_KEY', '')
    if not app_id or not key:
        print('Skipped: OneSignal secrets are not configured.')
        return
    body = payload(app_id, datetime.datetime.now(datetime.timezone.utc))
    request = urllib.request.Request(
        'https://api.onesignal.com/notifications?c=push',
        data=json.dumps(body).encode(),
        headers={'Authorization': 'Key ' + key, 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            result = json.load(response)
        errors = result.get('errors') or []
        no_audience = errors == ['All included players are not subscribed'] or errors == ['All included subscriptions are not subscribed']
        if errors and not no_audience:
            print('OneSignal validation errors: ' + json.dumps(errors).replace(key, '[REDACTED]'))
            raise SystemExit('OneSignal rejected the request; review configuration in its dashboard.')
        print('Reminder request accepted.' if result.get('id') else 'No subscribed devices matched the reminder filters.')
    except urllib.error.HTTPError as error:
        raise SystemExit('OneSignal request failed: HTTP ' + str(error.code)) from None
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise SystemExit('OneSignal request failed; check connection and service configuration.') from None


if __name__ == '__main__':
    main()
