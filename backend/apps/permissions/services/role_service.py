from apps.permissions.models import FormRole


def assign_role(form, user, role):
    role_obj, _created = FormRole.objects.update_or_create(
        form=form,
        user=user,
        defaults={"role": role},
    )
    return role_obj


def remove_role(form, user):
    return FormRole.objects.filter(form=form, user=user).delete()


def get_role(form, user):
    if not user or not getattr(user, "is_authenticated", False):
        return None
    return (
        FormRole.objects.filter(form=form, user=user)
        .values_list("role", flat=True)
        .first()
    )
