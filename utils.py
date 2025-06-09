import random
import string

CODE_LENGTH = 6
ALPHANUM = string.ascii_letters + string.digits

def generate_shortcode(existing_codes=None):
    """
    Generate a unique 6-character alphanumeric shortcode.
    Optionally checks against a set of existing codes.
    """
    existing_codes = existing_codes or set()
    while True:
        code = ''.join(random.choices(ALPHANUM, k=CODE_LENGTH))
        if code not in existing_codes:
            return code
