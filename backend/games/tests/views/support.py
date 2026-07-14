"""Shared assertion helpers for games view tests.

These helpers exist to avoid the pattern of issuing two near-identical
requests to the same endpoint just to check the status code and the
response body separately. A single request/response pair is enough for
both.
"""

import json


def assert_json_response(response, status_code, **expected_fields):
    """Assert the response status code and return its parsed JSON body.

    Any keyword argument is also asserted against the corresponding
    top-level key of the parsed body, e.g.:

        data = assert_json_response(response, 200, name='Gandalf')

    is equivalent to (but replaces the need for two separate requests to
    check the following independently):

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['name'] == 'Gandalf'

    Returns the parsed body so callers can make further assertions on it.
    """
    assert response.status_code == status_code
    data = json.loads(response.content)
    for key, value in expected_fields.items():
        assert data[key] == value
    return data
