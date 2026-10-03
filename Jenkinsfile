pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -t internship-backend:jenkins ./backend'
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t internship-frontend:jenkins ./frontend'
            }
        }

        stage('Verify Images') {
            steps {
                sh 'docker images internship-backend:jenkins'
                sh 'docker images internship-frontend:jenkins'
            }
        }
    }
}