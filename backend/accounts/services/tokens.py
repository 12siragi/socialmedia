from django.contrib.auth.tokens import PasswordResetTokenGenerator

class AccountActivationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        # Use is_email_verified to track verification
        return str(user.pk) + str(timestamp) + str(user.is_email_verified)

account_activation_token = AccountActivationTokenGenerator()
