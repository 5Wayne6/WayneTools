// pages/responsive/responsive.js
const QRCode = require('../../myhelper/others-helper/weapp-qrcode.js')
import rpx2px from '../../myhelper/others-helper/rpx2px.js'
let qrcode;

// 300rpx 在6s上为 150px
const qrcodeWidth = rpx2px(300)

Page({
  data: {
    text: 'https://www.baidu.com',
    image: '',
    // 用于设置wxml里canvas的width和height样式
    qrcodeWidth: qrcodeWidth,
    imgsrc: ''
  },
  onLoad: function(options) {},
  onReady() {
    const z = this
    qrcode = new QRCode('canvas', {
      usingIn: this, // usingIn 如果放到组件里使用需要加这个参数
      // text: "https://github.com/tomfriwel/weapp-qrcode",
      image: '/images/index-icon/qr-test.jpg',
      width: qrcodeWidth,
      height: qrcodeWidth,
      colorDark: "#000000",
      colorLight: "white",
      correctLevel: QRCode.CorrectLevel.H,
    });

    // 生成图片，绘制完成后调用回调
    qrcode.makeCode(z.data.text, () => {
      // 回调
      setTimeout(() => {
        qrcode.exportImage(function(path) {
          z.setData({
            imgsrc: path
          })
        })
      }, 200)
    })
  },
  confirmHandler: function(e) {
    let {
      value
    } = e.detail
    this.renderCode(value)
  },
  renderCode(value) {
    const z = this
    qrcode.makeCode(value, () => {
      qrcode.exportImage(function(path) {
        z.setData({
          imgsrc: path
        })
      })
    })
  },
  inputHandler: function(e) {
    var value = e.detail.value
    this.setData({
      text: value
    })
  },
  tapHandler: function() {
    this.renderCode(this.data.text)
  },
  back: function () {
    wx.navigateBack({delta:1});
  },
  // 长按保存
  save: function() {
    console.log('save')
    wx.showActionSheet({
      itemList: ['保存图片'],
      success: function(res) {
        console.log(res.tapIndex)
        if (res.tapIndex == 0) {
          qrcode.exportImage(function(path) {
            wx.saveImageToPhotosAlbum({
              filePath: path,
            })
          })
        }
      }
    })
  }
})