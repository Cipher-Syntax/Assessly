from apps.responses.models import ResponseEvent


def append_event(session, event_type, metadata, occurred_at):
    return ResponseEvent.objects.create(
        session=session,
        event_type=event_type,
        metadata=metadata or {},
        occurred_at=occurred_at,
    )
