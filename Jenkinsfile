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
                        sh -c "npm run lint || true"
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

        stage('Validate Docker Compose') {
            steps {
                sh '''
                    echo "Creating CI Compose override..."

                    cat > docker-compose.ci.yml <<'EOF'
services:

  postgres:
    container_name: internship-ci-validate-postgres
    ports: !reset []

  backend:
    container_name: internship-ci-validate-backend
    image: internship-backend:jenkins
    env_file: !reset []
    ports: !reset []
    environment:
      DJANGO_SECRET_KEY: ci-test-only-secret-key

  frontend:
    container_name: internship-ci-validate-frontend
    image: internship-frontend:jenkins
    ports: !reset []

  nginx:
    container_name: internship-ci-validate-nginx
    volumes: !reset []
    ports: !reset []
EOF

                    echo "Validating Compose configuration..."
                    docker compose \
                        -f docker-compose.yml \
                        -f docker-compose.ci.yml \
                        config

                    echo "Starting Compose stack..."
                    docker compose \
                        -p internship-ci \
                        -f docker-compose.yml \
                        -f docker-compose.ci.yml \
                        up -d

                    echo "Checking containers..."
                    docker compose \
                        -p internship-ci \
                        -f docker-compose.yml \
                        -f docker-compose.ci.yml \
                        ps

                    echo "Checking Django..."
                    docker compose \
                        -p internship-ci \
                        -f docker-compose.yml \
                        -f docker-compose.ci.yml \
                        exec -T backend python manage.py check

                    echo "Running Database Migrations..."
                    docker compose \
                        -p internship-ci \
                        -f docker-compose.yml \
                        -f docker-compose.ci.yml \
                        exec -T backend python manage.py migrate

                    echo "Checking Nginx configuration..."
                    docker compose \
                        -p internship-ci \
                        -f docker-compose.yml \
                        -f docker-compose.ci.yml \
                        exec -T nginx nginx -t

                    echo "Docker Compose validation successful!"
                '''
            }
        }

        stage('Push Images to GHCR') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'ghcr-credentials',
                        usernameVariable: 'GHCR_USERNAME',
                        passwordVariable: 'GHCR_TOKEN'
                    )
                ]) {
                    sh '''
                        echo "$GHCR_TOKEN" | docker login ghcr.io \
                            -u "$GHCR_USERNAME" \
                            --password-stdin

                        docker tag internship-backend:jenkins \
                            ghcr.io/sirine040204/internship-backend:latest

                        docker tag internship-backend:jenkins \
                            ghcr.io/sirine040204/internship-backend:build-${BUILD_NUMBER}

                        docker tag internship-frontend:jenkins \
                            ghcr.io/sirine040204/internship-frontend:latest

                        docker tag internship-frontend:jenkins \
                            ghcr.io/sirine040204/internship-frontend:build-${BUILD_NUMBER}

                        docker push \
                            ghcr.io/sirine040204/internship-backend:latest

                        docker push \
                            ghcr.io/sirine040204/internship-backend:build-${BUILD_NUMBER}

                        docker push \
                            ghcr.io/sirine040204/internship-frontend:latest

                        docker push \
                            ghcr.io/sirine040204/internship-frontend:build-${BUILD_NUMBER}

                        docker logout ghcr.io
                    '''
                }
            }
        }
    }

    post {
        always {
            sh '''
                docker compose \
                    -p internship-ci \
                    -f docker-compose.yml \
                    -f docker-compose.ci.yml \
                    down 2>/dev/null || true

                rm -f docker-compose.ci.yml

                docker rm -f internship-ci-postgres 2>/dev/null || true
                docker network rm internship-ci-network 2>/dev/null || true
            '''
        }
    }
}