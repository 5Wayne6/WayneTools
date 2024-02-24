// pages/Unit_convert-tool/Unit_convert-tool.js
const unitsConvert = require('units-convert');
const convert = unitsConvert.default;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    multiArray: [['长度', '质量', '面积','体积','时间','温度','数据'], ['纳米(nm)', '微米(μm)', '毫米(mm)', '厘米(cm)', '米(m)','千米(km)'], ['纳米(nm)', '微米(μm)', '毫米(mm)', '厘米(cm)', '米(m)','千米(km)']],
    multiIndex: [0, 0, 0],
    num1:'',
    num2:'',
    namearray:{
      '纳米(nm)':'nm',
      '微米(μm)':'μm',
      '毫米(mm)':'mm',
      '厘米(cm)':'cm',
      '米(m)':'m',
      '千米(km)':'km',
      '微克(mcg)':'mcg',
      '毫克(mg)':'mg',
      '克(g)':'g',
      '千克(kg)':'kg',
      '盎司(oz)':'oz',
      '磅(lb)':'lb',
      '吨(t)':'t',
      '平方毫米(mm^2)':'mm2',
      '平方厘米(cm^2)':'cm2',
      '平方米(m^2)':'m2',
      '平方千米(km^2)':'km2',
      '立方毫米(mm^3)':'mm3',
      '立方厘米(cm^3)':'cm3',
      '立方米(m^3)':'m3',
      '立方千米(km^3)':'km3',
      '毫升(ml)':'ml',
      '升(l)':'l',
      '千升(kl)':'kl',
      '毫秒(ms)':'ms',
      '秒(s)':'s',
      '分钟(min)':'min',
      '小时(h)':'h',
      '天(d)':'d',
      '周(week)':'week',
      '月(month)':'month',
      '年(year)':'year',
      '摄氏度(C)':'C',
      '华氏度(F)':'F',
      '开尔文(K)':'K',
      '比特(b)':'b',
      '千比特(Kb)':'Kb',
      '兆比特(Mb)':'Mb',
      '千兆比特(Gb)':'Gb',
      '太比特(Tb)':'Tb',
      '字节(B)':'B',
      '千字节(KB)':'KB',
      '兆字节(MB)':'MB',
      '千兆字节(GB)':'GB',
      '太字节(TB)':'TB',
    }
  },

  bindMultiPickerColumnChange: function (e) {
    console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    var data = {
      multiArray: this.data.multiArray,
      multiIndex: this.data.multiIndex
    };
    data.multiIndex[e.detail.column] = e.detail.value;
    switch (e.detail.column) {
      case 0:
        switch (data.multiIndex[0]) {
          case 0:
            data.multiArray[1] = ['纳米(nm)', '微米(μm)', '毫米(mm)', '厘米(cm)', '米(m)','千米(km)'];
            data.multiArray[2] = ['纳米(nm)', '微米(μm)', '毫米(mm)', '厘米(cm)', '米(m)','千米(km)'];
            break;
          case 1:
            data.multiArray[1] = ['微克(mcg)', '毫克(mg)', '克(g)','千克(kg)','盎司(oz)','磅(lb)','吨(t)'];
            data.multiArray[2] = ['微克(mcg)', '毫克(mg)', '克(g)','千克(kg)','盎司(oz)','磅(lb)','吨(t)'];
            break;
          case 2:
            data.multiArray[1] = ['平方毫米(mm^2)', '平方厘米(cm^2)', '平方米(m^2)','平方千米(km^2)'];
            data.multiArray[2] = ['平方毫米(mm^2)', '平方厘米(cm^2)', '平方米(m^2)','平方千米(km^2)'];
            break;
          case 3:
            data.multiArray[1] = ['立方毫米(mm^3)', '立方厘米(cm^3)', '立方米(m^3)','立方千米(km^3)','毫升(ml)','升(l)','千升(kl)'];
            data.multiArray[2] = ['立方毫米(mm^3)', '立方厘米(cm^3)', '立方米(m^3)','立方千米(km^3)','毫升(ml)','升(l)','千升(kl)'];
            break;
          case 4:
            data.multiArray[1] = ['毫秒(ms)', '秒(s)', '分钟(min)','小时(h)','天(d)','周(week)','月(month)','年(year)'];
            data.multiArray[2] = ['毫秒(ms)', '秒(s)', '分钟(min)','小时(h)','天(d)','周(week)','月(month)','年(year)'];
            break;
          case 5:
            data.multiArray[1] = ['摄氏度(C)', '华氏度(F)', '开尔文(K)'];
            data.multiArray[2] = ['摄氏度(C)', '华氏度(F)', '开尔文(K)'];
            break;
          case 6:
            data.multiArray[1] = ['比特(b)', '千比特(Kb)', '兆比特(Mb)','千兆比特(Gb)','太比特(Tb)','字节(B)','千字节(KB)','兆字节(MB)','千兆字节(GB)','太字节(TB)'];
            data.multiArray[2] = ['比特(b)', '千比特(Kb)', '兆比特(Mb)','千兆比特(Gb)','太比特(Tb)','字节(B)','千字节(KB)','兆字节(MB)','千兆字节(GB)','太字节(TB)'];
            break;
        }
        data.multiIndex[1] = 0;
        data.multiIndex[2] = 0;
        break;
    }
    console.log(data.multiIndex);
    this.setData(data);
  },

  bindMultiPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)

    this.setData({
      multiIndex: e.detail.value,
      num1 : '',
      num2 : '',
    })
  },

  KeyInput: function (e) {
    if(e.currentTarget.id == 'num1' && e.detail.value != ''){
      this.data.num1 = e.detail.value;
      this.data.num2 = convert(this.data.num1).from(this.data.namearray[this.data.multiArray[1][this.data.multiIndex[1]]]).to(this.data.namearray[this.data.multiArray[2][this.data.multiIndex[2]]]);
    }
    if(e.currentTarget.id == 'num2' && e.detail.value != ''){
      this.data.num2 = e.detail.value;
      this.data.num1 = convert(this.data.num2).from(this.data.namearray[this.data.multiArray[2][this.data.multiIndex[2]]]).to(this.data.namearray[this.data.multiArray[1][this.data.multiIndex[1]]]);
    }

    if(e.detail.value != ''){
      this.setData({
        num1 : this.data.num1,
        num2 : this.data.num2,
      });
    }
    else{
      this.setData({
        num1 : '',
        num2 : '',
      });
    }
  
  },

  Empty_clear: function () {
    this.setData({
      num1 : '',
      num2 : '',
    });
  },
  Back: function () {
    wx.navigateBack({
      delta : 1,
    });
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

  }
})