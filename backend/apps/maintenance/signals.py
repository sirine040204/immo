import calendar
from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Intervention, ModeleEntretien

@receiver(post_save, sender=Intervention)
def auto_update_immobilisation_maintenance_dates(sender, instance, created, **kwargs):
    """
    Updates the date_derniere_maintenance and date_prochaine_maintenance 
    of the related Immobilisation when an Intervention is completed (TERMINEE).
    """
    if instance.statut == Intervention.Statut.TERMINEE and instance.date_fin:
        immobilisation = instance.immobilisation
        
        # Update last maintenance date
        immobilisation.date_derniere_maintenance = instance.date_fin
        
        # Calculate next maintenance date if applicable
        if instance.modele_entretien and instance.modele_entretien.type_planification == ModeleEntretien.TypePlanification.TEMPS:
            periodicite = instance.modele_entretien.periodicite
            unite = instance.modele_entretien.unite_periodicite
            
            if periodicite and unite:
                next_date = instance.date_fin
                if unite == ModeleEntretien.UnitePeriodicite.JOURS:
                    next_date += timedelta(days=periodicite)
                elif unite == ModeleEntretien.UnitePeriodicite.SEMAINES:
                    next_date += timedelta(weeks=periodicite)
                elif unite == ModeleEntretien.UnitePeriodicite.MOIS:
                    month = next_date.month - 1 + periodicite
                    year = next_date.year + month // 12
                    month = month % 12 + 1
                    day = min(next_date.day, calendar.monthrange(year, month)[1])
                    next_date = next_date.replace(year=year, month=month, day=day)
                elif unite == ModeleEntretien.UnitePeriodicite.ANNEES:
                    year = next_date.year + periodicite
                    # Handle leap year (e.g. Feb 29 to Feb 28 in non-leap year)
                    if next_date.month == 2 and next_date.day == 29 and not calendar.isleap(year):
                        next_date = next_date.replace(year=year, day=28)
                    else:
                        next_date = next_date.replace(year=year)
                        
                immobilisation.date_prochaine_maintenance = next_date
                
        elif instance.modele_entretien and instance.modele_entretien.type_planification == ModeleEntretien.TypePlanification.DATE_FIXE:
            if instance.modele_entretien.date_fixe and instance.modele_entretien.date_fixe > instance.date_fin:
                immobilisation.date_prochaine_maintenance = instance.modele_entretien.date_fixe
        
        # Save the immobilisation
        immobilisation.save(update_fields=['date_derniere_maintenance', 'date_prochaine_maintenance'])

@receiver(post_save, sender=Intervention)
def sync_intervention_calendar(sender, instance, created, **kwargs):
    """
    Sync intervention to Google Calendar when it has a scheduled date.
    Delete it if it is cancelled.
    """
    from .google_calendar import sync_intervention_to_calendar, delete_intervention_from_calendar
    
    if instance.statut == Intervention.Statut.ANNULEE:
        if instance.google_event_id:
            delete_intervention_from_calendar(instance)
    elif instance.date_prevue and instance.statut in [Intervention.Statut.PLANIFIEE, Intervention.Statut.EN_COURS]:
        sync_intervention_to_calendar(instance)
    elif not instance.date_prevue and instance.google_event_id:
        # Date was removed, delete from calendar
        delete_intervention_from_calendar(instance)
