import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from django.conf import settings
from datetime import datetime, time
import logging

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    creds_path = os.path.join(settings.BASE_DIR, 'google-credentials.json')
    if not os.path.exists(creds_path):
        logger.error(f"Google credentials not found at {creds_path}")
        return None

    try:
        creds = service_account.Credentials.from_service_account_file(
            creds_path, scopes=SCOPES
        )
        service = build('calendar', 'v3', credentials=creds)
        return service
    except Exception as e:
        logger.error(f"Failed to build Google Calendar service: {e}")
        return None

def sync_intervention_to_calendar(intervention, calendar_id=None):
    """
    Sync an Intervention to Google Calendar.
    Requires date_prevue to be set.
    """
    if not intervention.date_prevue:
        return None

    service = get_calendar_service()
    if not service:
        return None
        
    if not calendar_id:
        calendar_id = getattr(settings, 'GOOGLE_CALENDAR_ID', os.environ.get('GOOGLE_CALENDAR_ID', 'sirinelovesyou@gmail.com'))

    # Prepare event data
    from datetime import timedelta
    start_date = intervention.date_prevue
    end_date = intervention.date_fin or start_date
    
    if end_date < start_date:
        end_date = start_date
        
    # Google Calendar requires end date for all-day events to be EXCLUSIVE
    end_date = end_date + timedelta(days=1)
    
    # Simple all-day event for now
    event = {
        'summary': f'Intervention: {intervention.immobilisation.designation}',
        'description': f"Type: {intervention.type_entretien.nom}\nPriorité: {intervention.get_priorite_display()}\nMotif: {intervention.motif}",
        'start': {
            'date': start_date.isoformat(),
            'timeZone': 'Europe/Paris',
        },
        'end': {
            'date': end_date.isoformat(),
            'timeZone': 'Europe/Paris',
        },
    }

    try:
        if intervention.google_event_id:
            # Update existing event
            updated_event = service.events().update(
                calendarId=calendar_id, 
                eventId=intervention.google_event_id, 
                body=event
            ).execute()
            logger.info(f"Updated Google Calendar event: {updated_event.get('htmlLink')}")
            return updated_event
        else:
            # Create new event
            created_event = service.events().insert(
                calendarId=calendar_id, 
                body=event
            ).execute()
            
            # Save the event ID back to the intervention
            intervention.google_event_id = created_event.get('id')
            intervention.save(update_fields=['google_event_id'])
            
            logger.info(f"Created Google Calendar event: {created_event.get('htmlLink')}")
            return created_event
    except Exception as e:
        logger.error(f"Error syncing intervention {intervention.id} to Google Calendar: {e}")
        return None

def delete_intervention_from_calendar(intervention, calendar_id=None):
    if not intervention.google_event_id:
        return
        
    service = get_calendar_service()
    if not service:
        return

    if not calendar_id:
        calendar_id = getattr(settings, 'GOOGLE_CALENDAR_ID', os.environ.get('GOOGLE_CALENDAR_ID', 'sirinelovesyou@gmail.com'))

    try:
        service.events().delete(
            calendarId=calendar_id, 
            eventId=intervention.google_event_id
        ).execute()
        
        intervention.google_event_id = None
        intervention.save(update_fields=['google_event_id'])
        logger.info(f"Deleted Google Calendar event for intervention {intervention.id}")
    except Exception as e:
        logger.error(f"Error deleting Google Calendar event for intervention {intervention.id}: {e}")
