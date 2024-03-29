// pages/about/about.js
const settinghelper = require('../../myhelper/setting-helper.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    author: settinghelper.set.author,
    version: settinghelper.set.version,
  },

  introduce(e){
    let url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    })
  },

  ClearAll(){
    wx.clearStorageSync();
    wx.clearStorage();
    wx.reLaunch({
      url: '/pages/about/about'
    });
    wx.showToast({
      title: '清除成功',
      icon: 'none',
      duration: 1500
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  
})