from django.test import TestCase
from rest_framework.test import APIClient

from common.constants import CATEGORY_OPTIONS
from onboarding.models import OnboardingStep, UserOnboarding
from users.models import User

CATEGORY_SLUGS = [key for key, _ in CATEGORY_OPTIONS]


class OnboardingFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="onboard@example.com",
            password="testpass123",
            firebase_uid="onboard-uid",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_profile_patch_advances_to_categories(self):
        response = self.client.patch(
            "/api/mobile/v1/onboarding/profile",
            {"displayName": "Curator Reader"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        onboarding = UserOnboarding.objects.get(user=self.user)
        self.assertEqual(onboarding.current_step, OnboardingStep.CATEGORIES)
        self.assertEqual(self.user.display_name, "Curator Reader")

    def test_categories_patch_requires_three(self):
        response = self.client.patch(
            "/api/mobile/v1/onboarding/categories",
            {"categories": CATEGORY_SLUGS[:2]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_categories_patch_advances_step(self):
        response = self.client.patch(
            "/api/mobile/v1/onboarding/categories",
            {"categories": CATEGORY_SLUGS[:3]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        onboarding = UserOnboarding.objects.get(user=self.user)
        self.assertEqual(onboarding.current_step, OnboardingStep.APPEARANCE)
