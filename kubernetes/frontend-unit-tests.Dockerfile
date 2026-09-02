# Lightweight image that bundles the Angular source on top of the
# already-published marczakx/restaurant-e2e:1.0.2 image (chrome +
# node + cypress stack). The published base is only ~1.2 GB vs the
# 7 GB cypress/browsers image, which keeps the resulting test image
# small enough to push to Docker Hub from this environment.
#
# Build from the repository root:
#   docker build -t marczakx/restaurant-frontend-unit-tests:dev234 \
#     -f kubernetes/frontend-unit-tests.Dockerfile .
#   docker push marczakx/restaurant-frontend-unit-tests:dev234
#
# The container entrypoint runs the unit test suite in one shot.
FROM marczakx/restaurant-e2e:1.0.2
WORKDIR /src
COPY front/package.json front/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY front/ ./
ENV CHROME_BIN=/usr/bin/google-chrome
CMD ["npx", "ng", "test", "--watch=false", \
     "--karma-config=karma-ci.conf.js", \
     "--browsers=ChromeHeadlessNoSandbox"]
