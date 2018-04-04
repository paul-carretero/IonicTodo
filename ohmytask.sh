
echo "╔═════════════════════════════════════════════╗"
echo "║   ____  _     __  __    _______        _    ║"
echo "║  / __ \| |   |  \/  |  |__   __|      | |   ║"
echo "║ | |  | | |__ | \  / |_   _| | __ _ ___| | __║"
echo "║ | |  | | '_ \| |\/| | | | | |/ _' / __| |/ /║"
echo "║ | |__| | | | | |  | | |_| | | (_| \__ \   < ║"
echo "║  \____/|_| |_|_|  |_|\__, |_|\__,_|___/_|\_\║"
echo "║                       __/ |                 ║"
echo "║                      |___/                  ║"
echo "║                                             ║"



if [ "$#" -ne 1 ]
then
  	echo "╠═════════════════════════════════════════════╣"
	echo "║                                             ║"
	echo "║usage: ./ohmytask.sh <debug|prod|doc|rebuild>║"
	echo "║                                             ║"
	echo "╚═════════════════════════════════════════════╝"
  	exit 1
fi

if [ $1 = "prod" ]
	then
	echo "╚═════════════════════════════════════════════╝"
	cp -frv ./plugins_fixes/platforms ./
	echo "Attention, veuillez modifier le fichier platforms/android/release-signing.properties en fonction de votre environement"
	sudo ionic cordova run android --device --prod --release --aot --minifyjs --minifycss --optimizejs
	sudo chown -R $USER .
elif [ $1 = "doc" ]
	then
	echo "╚═════════════════════════════════════════════╝"
	npm run doc:buildandserve
elif [ $1 = "debug" ]
	then
	echo "╚═════════════════════════════════════════════╝"
	rm platforms/android/debug-signing.properties 2> /dev/null 
	rm platforms/android/release-signing.properties 2> /dev/null
	ionic cordova run android --device
elif [ $1 = "rebuild" ]
	then
	echo "╚═════════════════════════════════════════════╝"
	rm -rf node_modules
	rm -rf platforms
	rm -rf plugins
	npm i
	ionic cordova prepare
	ionic cordova platforms rm android
	cp -frv ./plugins_fixes/node_modules ./
	cp -frv ./plugins_fixes/plugins ./
	ionic cordova platforms add android@6.4.0
else
	echo "╠═════════════════════════════════════════════╣"
	echo "║                                             ║"
	echo "║usage: ./ohmytask.sh <debug|prod|doc|rebuild>║"
	echo "║                                             ║"
	echo "╚═════════════════════════════════════════════╝"
	exit 1
fi