var app = new Vue({
    el: "#ffo",
    data: {
        masterdb: {
            'ServantDB': {
                'Extra': {},
                'Localize': {},
                'Parts': {},
                'Servant': {}
            }
        },
        rarity: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 4, 3, 2, 1],
        rarityFlame: [
            'flame/flame_black.png',
            'flame/flame_bronze.png',
            'flame/flame_bronze.png',
            'flame/flame_silver.png',
            'flame/flame_gold.png',
            'flame/flame_gold.png'
        ],
        loadedServantDB: 0,
        qrcodeCipher: new aesjs.ModeOfOperation.cbc([0x06, 0x21, 0x37, 0xdc, 0xbe, 0x1d, 0x41, 0x51, 0x37, 0x0b, 0xa6, 0xfc, 0x16, 0x87, 0xac, 0xf2], [0xb2, 0x53, 0x13, 0xc6, 0x6b, 0xd7, 0x0b, 0xec, 0x3c, 0xec, 0x10, 0xc5, 0x59, 0x21, 0x1e, 0x15]),
        nowServant: {
            headId: 0,
            bodyId: 0,
            landId: 0,
            userId: '',
            sign: 0,
            permission: 0
        },
        calcedServantData: {
            inited: false,
            flame: ''
        },
        cachedImages: []
    },
    watch: {
        cachedImages: {
            handler(val, oldVal) {
                if (val.length == 6)
                    this.renderSvtResult();
            },
            deep: true
        }
    },
    methods: {
        calcQRCodeSign(headId, bodyId, landId) {
            return 5 * (bodyId + headId) + 3 * (landId + bodyId + headId) + 9 * (landId + bodyId) + 11 * (landId + headId) + 1999;
        },
        hex2Bytes(hexString) {
            return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        },
        resetServant() {
            this.nowServant = {
                headId: 0,
                bodyId: 0,
                landId: 0,
                userId: '00000000-0000-0000-0000-000000000000',
                sign: 0,
                permission: 0
            }
        },
        canvasDrawImage(position, url, direction, scale = 1, x = 0, y = 0) {
            let self = this;
            axios.head(url).then(resp => {
                if (resp.status == 200) {
                    let img = new Image();
                    img.src = url;
                    img.onload = function() {
                        self.cachedImages.push({
                            x: scale == 1 ? x : x - ((scale - 1) / 2 * img.width),
                            y: scale == 1 ? y : y - ((scale - 1) / 2 * img.height),
                            orgX: x,
                            scale: scale,
                            position: position,
                            img: img,
                            direction: direction,
                            success: true
                        });
                    }
                }
            }).catch(err => {
                self.cachedImages.push({
                    position: position,
                    success: false
                });
            })
        },
        wrapId(id) {
            if (id < 10)
                return '00' + id;
            else if (id < 100)
                return '0' + id;
            else
                return id;
        },
        calcHeadScale(head, body) {
            let p = body / head;
            if (p == NaN || p == 0)
                return 1.0;
            return p;
        },
        renderSvtResult() {
            this.cachedImages = this.cachedImages.filter(x => x.success).sort(x => x.position);
            let canvas = document.getElementById('svtResult').getContext('2d');
            this.cachedImages.forEach(x => {
                if (x.direction != 0) {
                    canvas.save();
                    canvas.translate(x.img.width + x.orgX * 2, 0);
                    canvas.scale(-1, 1);
                }
                if (x.scale == 1)
                    canvas.drawImage(x.img, x.x, x.y);
                else
                    canvas.drawImage(x.img, 0, 0, x.img.width, x.img.height, x.x, x.y, x.img.width * x.scale, x.img.height * x.scale);
                if (x.direction != 0)
                    canvas.restore();
            })
            this.cachedImages = []
            this.calcedServantData.inited = true;
        },
        calcServant() {
            let svtIdArray = [this.nowServant.headId, this.nowServant.bodyId, this.nowServant.landId];
            let svt = this.masterdb.ServantDB.Servant.filter(x => svtIdArray.indexOf(x.servant_id) != -1);
            let rarity = 0;

            let svtd = {}
            let part = {}

            let self = this;
            svt.forEach(s => {
                rarity += s.rarity;
                svtd[s.servant_id] = s;
                part[s.servant_id] = self.masterdb.ServantDB.Parts.find(x => x.servant_id == s.servant_id);
            })
            this.calcedServantData.flame = this.rarityFlame[this.rarity[rarity]];

            let headScale = this.calcHeadScale(part[this.nowServant.headId].scale, part[this.nowServant.bodyId].scale);

            let head_x2 = part[this.nowServant.bodyId].head_x2;
            if (head_x2 == 0)
                head_x2 = part[this.nowServant.bodyId].head_x;

            let head_y2 = part[this.nowServant.bodyId].head_y2;
            if (head_y2 == 0)
                head_y2 = part[this.nowServant.bodyId].head_y;

            this.canvasDrawImage(0, 'body/sv' + this.wrapId(this.nowServant.bodyId) + '_body_back.png', part[this.nowServant.bodyId].direction);
            this.canvasDrawImage(1, 'head/sv' + this.wrapId(this.nowServant.headId) + '_head_back.png', part[this.nowServant.headId].direction, headScale, head_x2 - 512, head_y2 - 512);
            this.canvasDrawImage(2, 'body/sv' + this.wrapId(this.nowServant.bodyId) + '_body_back2.png', part[this.nowServant.bodyId].direction);

            this.canvasDrawImage(3, 'body/sv' + this.wrapId(this.nowServant.bodyId) + '_body_middle.png', part[this.nowServant.bodyId].direction);
            this.canvasDrawImage(4, 'body/sv' + this.wrapId(this.nowServant.bodyId) + '_body_front.png', part[this.nowServant.bodyId].direction);
            this.canvasDrawImage(5, 'head/sv' + this.wrapId(this.nowServant.headId) + '_head_front.png', part[this.nowServant.headId].direction, headScale, head_x2 - 512, head_y2 - 512);
        },
        dragOver(event) {
            event.preventDefault();
        },
        drop(event) {
            event.preventDefault();
            let file = event.dataTransfer.files[0];
            let q = URL.createObjectURL(file);
            let gameQr = document.getElementById("gameQr");
            gameQr.src = q;
            let self = this;
            QCodeDecoder().decodeFromImage(gameQr, function(er, res) {
                if (er != null)
                    self.$alert("无法读取二维码，请使用清晰度更高的图片或截取图片中的二维码部分");
                else {
                    let d2 = String.fromCharCode.apply(null, aesjs.padding.pkcs7.strip(self.qrcodeCipher.decrypt(self.hex2Bytes(res))));
                    let data = d2.split(',');
                    self.nowServant.headId = parseInt(data[0]);
                    self.nowServant.bodyId = parseInt(data[1]);
                    self.nowServant.landId = parseInt(data[2]);
                    self.nowServant.sign = parseInt(data[4]);

                    if (self.nowServant.sign != self.calcQRCodeSign(self.nowServant.headId, self.nowServant.bodyId, self.nowServant.landId)) {
                        self.resetServant();
                        self.$alert("该二维码不合法，请使用本工具或游戏内生成的二维码");
                        return;
                    }

                    self.nowServant.userId = data[3];
                    self.nowServant.permission = parseInt(data[5]);

                    self.calcServant();
                }
                gameQr.src = '';
            })
        }
    },
    mounted() {
        let dbCipher = new aesjs.ModeOfOperation.ecb([0x24, 0xfd, 0xf4, 0x0b, 0xa6, 0x4f, 0xb1, 0x53, 0xa6, 0x70, 0xa5, 0x2f, 0xfd, 0xb6, 0x20, 0x4f]);
        let Buffer = require('buffer').Buffer
        let LZ4 = require('lz4')
        for (let mainDB in this.masterdb) {
            for (let subDB in this.masterdb[mainDB]) {
                let fileName = "gamedata/" + mainDB + "-" + subDB + ".bytes";
                axios.get(fileName, {
                    responseType: 'arraybuffer'
                }).then(result => {
                    let decryptedBuffer = dbCipher.decrypt(new Uint8Array(result.data));
                    let dataView = new DataView(decryptedBuffer.slice(0, 4).buffer)
                    let outputLength = dataView.getUint32(0, true);
                    let decrypted = Buffer.alloc(outputLength);
                    LZ4.decodeBlock(decryptedBuffer.slice(8, decryptedBuffer.length - 1), decrypted)
                    this.masterdb[mainDB][subDB] = CSVJSON.csv2json(decrypted.toString(), {
                        parseNumbers: true
                    });
                    this.loadedServantDB++;
                }).catch(err => {
                    this.$alert("读取" + subDB + "失败\n错误：" + err + "\n请刷新页面");
                });
            }
        }
        axios.defaults.timeout = 5000;
    }
});