// index.js
const functionhelper = require('../../myhelper/funtion-helper.js');
const settinghelper = require('../../myhelper/setting-helper.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    slogan: [
      '时间是治愈一切创伤的良药',
      '唯有在热爱中，我们才能找到生活的意义',
      '时光匆匆，珍惜此刻的平凡',
      '成长的路上，孤独是一种奢侈的陪伴',
      '学会忍受孤独，因为这是与生俱来的',
      '生活是一种需要勇气的艺术',
      '人生如画，不同的色彩构成独特的风景',
      '人生就像一本书，不去旅行就只看到了其中的一页',
      '了解自己是一切智慧的开始',
      '善待自己，因为你是自己一生的陪伴者',
    ],
    random: null,
    welcome: null,
    author: settinghelper.set.author,
    version: settinghelper.set.version,
  },

  random() {
    this.setData({
      random: Math.floor(Math.random() * 10)
    })
  },

  welcome() {//取得时间状态，以表示问好
    let text = null
    switch (new Date().getHours()) {
      case 6:
      case 7:
      case 8:
        text = "早上好"
        break
      case 9:
      case 10:
        text = "上午好"
        break
      case 11:
      case 12:
      case 13:
        text = "中午好"
        break
      case 14:
      case 15:
      case 16:
      case 17:
      case 18:
        text = "下午好"
        break
      case 19:
      case 20:
      case 21:
      case 22:
      case 23:
        text = "晚上好"
        break
      case 24:
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        text = "早点睡觉"
        break
    }
    this.setData({
      welcome: text
    })
  },

  url: function (e) {
    functionhelper.url(e);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.random()
    this.welcome()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.random()
    this.welcome()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.onLoad();
    wx.stopPullDownRefresh();
    // wx.switchTab({
    //   url: '/pages/index/index',
    //   success: function () {
    //     // 调用 wx.stopPullDownRefresh() 来停止下拉刷新动画
    //     console.log("成功")
    //     wx.stopPullDownRefresh();
    //   },
    //   fail: function(){
    //     console.log("失败")
    //     wx.stopPullDownRefresh();
    //   }
    // });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    wx.showToast({
      title: '因为我懒，暂时只有这些了~~',
      icon: 'none',
      duration: 3000
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})
