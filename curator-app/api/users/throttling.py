from rest_framework.throttling import SimpleRateThrottle


class ScopedUserThrottle(SimpleRateThrottle):
    """
    Per-user throttle keyed on request.user.id when authenticated,
    falling back to client IP for anonymous requests.
    Views set throttle_scope to pick the rate from DEFAULT_THROTTLE_RATES.
    """

    scope = "reads"  # default scope, overridden per-view in get_cache_key
    scope_attr = "throttle_scope"

    def get_cache_key(self, request, view):
        self.scope = getattr(view, self.scope_attr, "reads")
        self.rate = self.get_rate()
        self.num_requests, self.duration = self.parse_rate(self.rate)

        if request.user and request.user.is_authenticated:
            ident = str(request.user.id)
        else:
            ident = self.get_ident(request)

        return self.cache_format % {"scope": self.scope, "ident": ident}

