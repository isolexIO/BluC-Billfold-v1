#!/bin/bash

sudo apt-get update && sudo apt-get upgrade -y

cd $HOME

wget "https://dl.walletbuilders.com/download?customer=c4833c4e46773f424605f72bf7cb1ae368b802f2dbd157d893&filename=bluchip-qt-linux.tar.gz" -O bluchip-qt-linux.tar.gz

mkdir $HOME/Desktop/BluChip

tar -xzvf bluchip-qt-linux.tar.gz --directory $HOME/Desktop/BluChip

mkdir $HOME/.bluchip

cat << EOF > $HOME/.bluchip/bluchip.conf
rpcuser=rpc_bluchip
rpcpassword=dR2oBQ3K1zYMZQtJFZeAerhWxaJ5Lqeq9J2
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
listen=1
server=1
addnode=node3.walletbuilders.com
EOF

cat << EOF > $HOME/Desktop/BluChip/start_wallet.sh
#!/bin/bash
SCRIPT_PATH=\`pwd\`;
cd \$SCRIPT_PATH
./bluchip-qt
EOF

chmod +x $HOME/Desktop/BluChip/start_wallet.sh

cat << EOF > $HOME/Desktop/BluChip/mine.sh
#!/bin/bash
SCRIPT_PATH=\`pwd\`;
cd \$SCRIPT_PATH
while :
do
./bluchip-cli generatetoaddress 1 \$(./bluchip-cli getnewaddress)
done
EOF

chmod +x $HOME/Desktop/BluChip/mine.sh
    
exec $HOME/Desktop/BluChip/bluchip-qt &

sleep 15

cd $HOME/Desktop/BluChip/

clear

exec $HOME/Desktop/BluChip/mine.sh