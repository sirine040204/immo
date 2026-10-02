from django.core.mail import send_mail
from django.conf import settings

def send_company_status_email(admin_user, company, action_type):
    """
    Sends an email to the company admin notifying them of a status change.
    action_type should be one of: 'APPROUVE', 'REJETE', 'SUSPENDU', 'REACTIVE'
    """
    if not admin_user or not admin_user.email:
        return

    status_messages = {
        "APPROUVE": "a été approuvée et est maintenant active",
        "REJETE": "a été rejetée",
        "SUSPENDU": "a été suspendue temporairement",
        "REACTIVE": "a été réactivée",
    }
    
    action_text = status_messages.get(action_type, "a été mise à jour")

    subject = f"Mise à jour du statut de votre entreprise ({company.nom_entreprise})"
    message = (
        f"Bonjour {admin_user.prenom},\n\n"
        f"Nous vous informons que le statut de votre entreprise '{company.nom_entreprise}' "
        f"{action_text}.\n\n"
        "Si vous avez des questions, n'hésitez pas à nous contacter.\n\n"
        "Cordialement,\n"
        "L'équipe AssetFlow"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=None,  # Will use DEFAULT_FROM_EMAIL
        recipient_list=[admin_user.email],
        fail_silently=False,
    )

def send_invitation_cancelled_email(user):
    """
    Sends an email to the employee notifying them that their invitation was cancelled.
    """
    if not user or not user.email:
        return

    subject = "Votre invitation à rejoindre Immo a été annulée"
    message = (
        f"Bonjour {user.prenom},\n\n"
        f"Votre invitation à rejoindre la plateforme AssetFlow a été annulée par l'administrateur de l'entreprise.\n\n"
        f"Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur.\n\n"
        f"L'équipe Immo"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=None,
        recipient_list=[user.email],
        fail_silently=True,
    )

def send_permission_request_processed_email(user, permission_name, action, motif=None):
    if not user or not user.email:
        return

    action_str = "acceptée" if action == "ACCEPT" else "rejetée"
    subject = f"Votre demande de permission a été {action_str}"
    
    message = f"Bonjour {user.prenom},\n\n"
    message += f"Votre demande pour la permission '{permission_name}' a été {action_str} par l'administrateur.\n\n"
    
    if action == "REJECT" and motif:
        message += f"Motif du rejet : {motif}\n\n"
        
    message += "Cordialement,\nL'équipe AssetFlow"

    send_mail(
        subject=subject,
        message=message,
        from_email=None,
        recipient_list=[user.email],
        fail_silently=True,
    )

def send_permission_revoked_email(user, permission_name):
    if not user or not user.email:
        return

    subject = "Une de vos permissions a été révoquée"
    
    message = f"Bonjour {user.prenom},\n\n"
    message += f"L'administrateur a révoqué votre permission '{permission_name}'. "
    message += f"Vous n'avez plus accès aux actions liées à cette permission.\n\n"
    message += "Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur.\n\n"
    message += "Cordialement,\nL'équipe AssetFlow"

    send_mail(
        subject=subject,
        message=message,
        from_email=None,
        recipient_list=[user.email],
        fail_silently=True,
    )
