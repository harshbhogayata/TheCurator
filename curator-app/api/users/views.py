from rest_framework import generics, permissions, response, status, views

from users.serializers import AccountUpdateSerializer, SessionSerializer


class CurrentSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return response.Response(SessionSerializer(request.user).data)


class AccountView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountUpdateSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        return response.Response(SessionSerializer(request.user).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(SessionSerializer(request.user).data)

    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        user.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class IdentityListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return response.Response(SessionSerializer(request.user).data["identities"])


class IdentitySyncView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return response.Response(SessionSerializer(request.user).data)
