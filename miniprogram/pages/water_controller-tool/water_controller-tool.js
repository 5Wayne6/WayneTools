// pages/water_controller-tool/water_controller-tool.js

// Page函数
Page({
  data: {
    buttonDisabled: false,//判断按钮是否可用
    main_button: '开启',//主要按钮
    device_status: '未连接',//显示连接状态
    isStarted: false,//判断是否开启
    bluetoothDevice: null,//要连接的蓝牙
    device_all:[],//储存所有符合条件的蓝牙
    showble: false,//初始化蓝牙弹窗不弹出
    end_service_uuid: null,//结束使用
    end_characteristic_uuid: null//结束使用
  },

  crc16changgong: function(data) {//
    let crc = 0x1017;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x0001) == 1) {
          crc >>= 1;
          crc ^= 0xA001;
        } else crc >>= 1;
      }
    }
    return crc;
  },

  makePayload: function(deviceName) {//
    const checksum = this.crc16changgong(deviceName.slice(-5));
    const payload = new Uint8Array([
      0xFE, 0xFE, 0x09, 0xB2,
      0x01, checksum & 0xFF, checksum >> 8, 0x00,
      0x70, 0xE2, 0xEB, 0x20,
      0x01, 0x01, 0x00, 0x00,
      0x00, 0x6C, 0x30, 0x00
    ]);
    return payload;
  },

  handleButtonClick: function() {
    if (this.data.isStarted) {
      this.end();
    }
    else {
      this.start();
      this.setData({
        showble: true
      })
    }
  },
  
  updateUi: function(stage){
    switch (stage){
      case "pending":
        this.setData({
          main_button: '请稍后',
          buttonDisabled: true
        })
        break;
      case "ok":
        this.setData({
          main_button: '结束',
          device_status: '已连接：' + this.data.bluetoothDevice.name,
          buttonDisabled: false
        })
        break;
      case "standby":
        this.setData({
          main_button: '开启',
          device_status: '未连接',
          buttonDisabled: false
        })
        break;
    }
  },
  
  start: async function() {
    var self = this;
  
    wx.openBluetoothAdapter({//开始
      success: function(res) {
        console.log('开启蓝牙模块成功', res);
        wx.startBluetoothDevicesDiscovery({//搜索
          success: function(res) {
            
            wx.getSetting({
              success (res) {
                if (res.authSetting['scope.userLocation'] == false) {//只需要查看定位权限
                  wx.showModal({
                    title: '请授权使用定位功能',
                    content: '是否打开设置',
                    success (res) {
                      if (res.confirm) {
                        wx.openSetting();
                      } 
                      else if (res.cancel) {
                        //暂时不写
                      }
                    }
                  })
                }
              }
            })
            if(wx.getSystemSetting().locationEnabled == false){
              wx.showToast({
                title: '请同时打开蓝牙和定位',
                icon: 'none',
                duration: 3000
              });
            }
            
            wx.onBluetoothDeviceFound(function(res) {//发现设备
              if(res.devices[0].name && res.devices[0].name.startsWith("Water")){
                let deviceList = self.data.device_all;//这里发现一个bug，重复打开会添加重复的水控器(暂时未修复)
                deviceList.push(res.devices[0]);
                self.setData({
                  device_all: deviceList
                });
                console.log("符合条件的：",res.devices[0])
              }
            });//发现设备
          },
          fail: function(err) {//搜索
            console.error("无法搜索蓝牙设备：", err);
            if(err.errno == 1509009){
              wx.showToast({
                title: '检查是否开启定位',
                icon: 'none',
                duration: 3000
              });
            }
            else{
              wx.showToast({
                title: '无法搜索蓝牙设备',
                icon: 'none',
                duration: 3000
              });
            }
          }
        });//搜索
      },
      fail: function(err) {//开始
        console.log("开始失败",err);
        if(err.errno == 103){        
          wx.showModal({
            title: '请授权使用蓝牙功能',
            content: '是否打开设置',
            success (res) {
              if (res.confirm) {
                wx.openSetting();
              } 
              else if (res.cancel) {
                //暂时不写
              }
            }
          })          
        }
        else{
          wx.showToast({
            title: '请同时打开蓝牙和定位',
            icon: 'none',
            duration: 3000
          });
        }
      }
    });//开始
  },
  
  connect: async function(event) {
    self = this;
    this.updateUi("pending");
    this.setData({
      showble: false
    })
    console.log(event.currentTarget.dataset.dev)
    self.data.bluetoothDevice = event.currentTarget.dataset.dev;
    console.log("0",self.data.bluetoothDevice)
    //
    wx.createBLEConnection({//建立连接
      deviceId: self.data.bluetoothDevice.deviceId,
      success: function(res) {
        console.log("连接成功");
        self.updateUi("ok")
        wx.stopBluetoothDevicesDiscovery({
          success(res) {
            console.log("已停止搜索蓝牙设备");
          }
        });
        //
        wx.getBLEDeviceServices({
          deviceId: self.data.bluetoothDevice.deviceId,
          success: async (res) => {
            console.log("获取服务中")
            console.log(res.services)
            for (let service of res.services) {
              if (service.uuid == '0000F1F0-0000-1000-8000-00805F9B34FB') {
                wx.getBLEDeviceCharacteristics({
                  deviceId: self.data.bluetoothDevice.deviceId,
                  serviceId: service.uuid,
                  success: async (res) => {
                    console.log("获取特征值中")
                    for (let characteristic of res.characteristics) {
                      if (characteristic.uuid == '0000F1F1-0000-1000-8000-00805F9B34FB') {
                        self.data.end_service_uuid = service.uuid;//后面用
                        self.data.end_characteristic_uuid = characteristic.uuid;//后面用
                        const buffer = self.makePayload(self.data.bluetoothDevice.name).buffer;
                        console.log("特征值对应的二进制值:",buffer)
                        wx.writeBLECharacteristicValue({
                          deviceId: self.data.bluetoothDevice.deviceId,
                          serviceId: service.uuid,
                          characteristicId: characteristic.uuid,
                          value: buffer,
                          success: (res) => {
                            console.log('数据写入成功', res);
                            self.data.isStarted = true;
                          },
                          fail: (err) => {
                            console.error('数据写入失败', err);
                            wx.showToast({
                              title: '数据写入失败',
                              icon: 'none',
                              duration: 3000
                            });
                          }
                        });
                        break;
                      }
                    }
                  },
                  fail: (err) => {
                    console.error('获取特征失败', err);
                    wx.showToast({
                      title: '获取特征失败',
                      icon: 'none',
                      duration: 3000
                    });
                  }
                });
                break;
              }
            }
          },
          fail: (err) => {
            console.error('获取服务失败', err);
            wx.showToast({
              title: '获取服务失败',
              icon: 'none',
              duration: 3000
            });
          }
        });
        //
      },
      fail: function(err) {
        console.error("连接失败", err);
        wx.showToast({
          title: '连接失败',
          icon: 'none',
          duration: 3000
        });
      }
    });      
 
  },

  end: async function(){
    var self = this;
    const endPayload = new ArrayBuffer(6);
    const dataView = new DataView(endPayload);
    dataView.setUint8(0, 0xFE);
    dataView.setUint8(1, 0xFE);
    dataView.setUint8(2, 0x09);
    dataView.setUint8(3, 0xB3);
    dataView.setUint8(4, 0x00);
    dataView.setUint8(5, 0x00);
    console.log("关闭准备写入")
    wx.writeBLECharacteristicValue({
      deviceId: self.data.bluetoothDevice.deviceId,
      serviceId: self.data.end_service_uuid,
      characteristicId: self.data.end_characteristic_uuid,
      value: endPayload,
      success: function(res) {
        wx.closeBLEConnection({
          deviceId: self.data.bluetoothDevice.deviceId,
          success: function(res) {
            self.data.isStarted = false;
            self.updateUi("standby");
            wx.closeBluetoothAdapter({
              success: function (res) {
                console.log('关闭蓝牙模块成功', res);
              },
              fail: function (res) {
                console.error('关闭蓝牙模块失败', res);
              }
            });
          },
          fail: function(error) {
            console.log(error);
          }
        });
      },
      fail: function(error) {
        console.log(error);
      }
    });
  },

  onCancel:function(){
    this.setData({
      showble:false,
    })
    wx.closeBluetoothAdapter({
      success: function (res) {
        console.log('关闭蓝牙模块成功', res);
      },
      fail: function (res) {
        console.error('关闭蓝牙模块失败', res);
      }
    });
  },

  back: function () {
    wx.navigateBack({delta:1});
  },

  onLoad: function(options) {
    wx.authorize({
      scope: 'scope.bluetooth',
    })
    wx.authorize({
      scope: 'scope.userLocation',
    })
  },
  
});

