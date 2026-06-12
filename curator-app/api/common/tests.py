import logging

from django.test import SimpleTestCase

from common.middleware import SensitiveLogFilter


class SensitiveLogFilterTests(SimpleTestCase):
    def test_redacting_formatted_message_clears_format_arguments(self):
        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname=__file__,
            lineno=1,
            msg="Firebase token verification failed: %s",
            args=(ValueError("secret"),),
            exc_info=None,
        )

        self.assertTrue(SensitiveLogFilter().filter(record))
        self.assertEqual(record.getMessage(), "[REDACTED]")

# Create your tests here.
