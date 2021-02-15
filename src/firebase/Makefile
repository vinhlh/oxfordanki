run-generate-apkg:
	functions-framework --target=generate_apkg --source functions/generate_apkg/main.py

deploy-generate-apkg:
	gcloud functions deploy generate_apkg --runtime python39 --trigger-http --allow-unauthenticated --source functions/generate_apkg/

run-firebase-functions:
	firebase emulators:start

deploy-firebase-functions:
	firebase deploy
