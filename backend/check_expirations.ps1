# check_expirations.ps1

# Go to the folder where this script is located
Set-Location $PSScriptRoot

# Activate the virtual environment
& ".\.venv\Scripts\Activate.ps1"

# Run the Django command
python manage.py check_document_expirations

# Run warranty expiration notifications
python manage.py check_garantie_expirations

# Run upcoming and overdue maintenance notifications
python manage.py check_maintenance_dates