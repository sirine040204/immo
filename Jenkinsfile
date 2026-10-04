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

        stage('Test Backend') {
            steps {
                sh '''
                    docker network create internship-ci-network || true

                    docker run -d \
                        --name internship-ci-postgres \
                        --network internship-ci-network \
                        -e POSTGRES_DB=immo \
                        -e POSTGRES_USER=immo \
                        -e POSTGRES_PASSWORD=immo \
                        postgres:17

                    echo "Waiting for PostgreSQL..."
                    sleep 5

                    docker run --rm \
                        --network internship-ci-network \
                        -e DJANGO_SECRET_KEY=ci-test-only-secret-key \
                        -e POSTGRES_HOST=internship-ci-postgres \
                        -e POSTGRES_PORT=5432 \
                        -e POSTGRES_DB=immo \
                        -e POSTGRES_USER=immo \
                        -e POSTGRES_PASSWORD=immo \
                        internship-backend:jenkins \
                        python manage.py test
                '''
            }
        }

        stage('Lint Frontend') {
            steps {
                sh '''
                    docker build \
                        --target builder \
                        -t internship-frontend-ci \
                        ./frontend

                    docker run --rm \
                        internship-frontend-ci \
                        npm run lint
                '''
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

    post {
        always {
            sh '''
                docker rm -f internship-ci-postgres 2>/dev/null || true
                docker network rm internship-ci-network 2>/dev/null || true
            '''
        }
    }
}