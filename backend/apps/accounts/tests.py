from django.test import TestCase

class BasicSetupTest(TestCase):
    def test_environment_is_ready(self):
        """A simple test to prove the Django test runner is working in Jenkins!"""
        self.assertTrue(True)
