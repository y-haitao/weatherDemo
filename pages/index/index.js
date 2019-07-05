// pages/index/index.js
var bmap = require('../../utils/bmap-wx')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentWeather: {}, //当天的天气部分
    inputCity: "", //查询其他城市
    topNum: 0, //返回顶部
    scroll_height: 0, //屏幕高度

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;

    //wx.getSystemInfoSync() 获取系统信息
    let windowHeight = wx.getSystemInfoSync().windowHeight; //可使用窗口高度，单位px
    let windowWidth = wx.getSystemInfoSync().windowWidth; //可使用窗口宽度，单位px
    that.setData({
      scroll_height: windowHeight * 750 / windowWidth
    });

    this.getWeather("");
  },

  //根据城市名称查询天气预报信息
  getWeather: function (cityName) {
    //首先进入前要提示：“加载中”
    wx.showToast({
      title: '加载中', //提示的内容
      icon: 'loading', //图标  loading 显示加载图标
      image: '', //自定义图标的本地路径，image 的优先级高于 icon
      duration: 1500, //提示的延迟时间
      mask: true, //是否显示透明蒙层，防止触摸穿透
      success: (result) => {

      },
      fail: () => { },
      complete: () => { }
    });

    var that = this;

    //创建百度地图对象，引入ak（ak请去百度地图申请）
    var BMap = new bmap.BMapWX({
      ak: 'nLfi6ohs0sWVqoZHq4tmbxVTtvaX2qcS'
    });

    //查询失败
    var fail = function (data) {
      //关闭加载提示框
      wx.hideLoading();

      var statusCode = data["statusCode"];
      //城市名称查询不到，弹窗提示
      if (statusCode == "No result available") {
        wx.showModal({
          title: '提示',
          content: '输入的城市名称有误，请重新输入',
          confirmText: '好的',
          confirmColor: '#ACB4E3',
          showCancel: false,
        });
      }
    };

    //查询成功
    var success = function (data) {
      // console.log(data.currentWeather);
      // console.log(data.originalData);
      //关闭加载提示框
      wx.hideLoading();

      //当日天气
      var currentWeather = data.currentWeather[0];

      //根据当日天气转换对应的背景图
      var bgURL = that.getBgURL(currentWeather.weatherDesc);

      //获取当前的日期和星期
      var currentDate = that.getDate().substring(5);
      var weekday = currentWeather.date.substring(0, 2);

      //获得天气图标URL
      var iconURL = that.getIconURL(currentWeather.weatherDesc);

      //截取出实时温度数据
      var begin = currentWeather.date.indexOf("时");
      var end = currentWeather.date.indexOf(")");
      currentWeather.date = currentWeather.date.substring(begin + 2, end - 1);
      // console.log(currentWeather.date);

      //调整温度范围显示
      currentWeather.temperature = that.tempSwitch(currentWeather.temperature);

      //判断空气质量等级
      var pm25 = currentWeather.pm25;
      var airClass = "";
      var airColor = "";
      if (pm25 <= 50) {
        airClass = "优";
        airColor = "#00EE00";
      }
      else if (pm25 > 50 && pm25 <= 100) {
        airClass = "良";
        airColor = "#EEEE00";
      }
      else if (pm25 > 100 && pm25 <= 150) {
        airClass = "轻度污染";
        airColor = "#FF8C00";
      }
      else if (pm25 > 150 && pm25 <= 200) {
        airClass = "中度污染";
        airColor = "#FF3030";
      }
      else if (pm25 > 200 && pm25 <= 300) {
        airClass = "重度污染";
        airColor = "#E066FF";
      }
      else {
        airClass = "严重污染";
        airColor = "#8B0000";
      };

      //温馨提示部分
      var tipsArray = new Array(5); //创建新数组
      tipsArray = data.originalData.results[0].index;
      var chuanyi = tipsArray[0]; //穿衣指数
      var xiche = tipsArray[1]; //洗车指数
      var ganmao = tipsArray[2]; //感冒指数
      var yundong = tipsArray[3]; //运动指数
      var ziwaixian = tipsArray[4]; //紫外线指数

      //chuanyi.tipt：穿衣指数
      //chuanyi.zs：炎热
      //chuanyi.des："天气炎热，建议着短衫、短裙、短裤、薄型T恤衫等清凉夏季服装。"

      //最近4天天气情况
      var forecastArray = new Array(4);
      forecastArray = data.originalData.results[0].weather_data;
      var forecast = new Array(3);
      for (var i = 0; i < 3; i++) {
        forecast[i] = forecastArray[i + 1];
        //调整日期显示
        forecast[i].date = that.getForecatDate(i, forecast[i].date);
        //获得天气图标URL
        forecast[i].iconURL = that.getIconURL(forecast[i].weather);
        //调整温度范围显示
        forecast[i].temperature = that.tempSwitch(forecast[i].temperature);
        //调整风向和风速显示，如果没有风速，则风速为空
        forecast[i].windDeriction = that.getWindDeriction(forecast[i].wind);
        forecast[i].windSpeed = that.getWindSpeed(forecast[i].wind);
      }

      //配置数据
      that.setData({
        bgURL: bgURL,
        iconURL: iconURL,
        currentWeather: currentWeather,
        currentDate: currentDate,
        weekday: weekday,
        airClass: airClass,
        airColor: airColor,
        forecast: forecast,
        chuanyi: chuanyi,
        xiche: xiche,
        ganmao: ganmao,
        yundong: yundong,
        ziwaixian: ziwaixian
      });
    };

    // 发起 weather 天气请求
    //cityName为空，查询定位城市天气
    if (!cityName) {
      BMap.weather({
        cityName: "",
        fail: fail,
        success: success
      });
    }
    //cityName不为空，查询输入城市天气
    else {
      BMap.weather({
        cityName: cityName,
        fail: fail,
        success: success
      });
    };
  },

  //获取当前日期
  getDate:function(){
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var strDate = date.getDate();
		if (month >= 1 && month <= 9) {
			month = "0" + month;
		}
		if (strDate >= 0 && strDate <= 9) {
			strDate = "0" + strDate;
		}
		var currentdate = year + "年" + month + "月" + strDate + "日";
		return currentdate;
  },
  
  //背景图路径
  getBgURL:function(weatherDesc){
    var condition = String(weatherDesc);
    // console.log(condition);
    var url = "";
    if (condition.includes("转")) {
      condition = condition.substring(0, condition.indexOf("转"));
    }

    if (condition.includes("晴")) {
      url = "../../image/qing.jpg";
    }
    else if (condition.includes("多云")) {
      url = "../../image/duoyun.jpg";
    }
    else if (condition.includes("阴")) {
      url = "../../image/yintian.jpeg";
    }
    else if (condition.includes("阵雨")) {
      url = "../../image/zhenyu.jpeg";
    }
    else if (condition.includes("雷阵雨")) {
      url = "../../image/leizhenyu.jpg";
    }
    else if (condition.includes("雨夹雪")) {
      url = "../../image/xue.jpeg";
    }
    else if (condition.includes("小雨")) {
      url = "../../image/yu.jpeg";
    }
    else if (condition.includes("中雨")) {
      url = "../../image/yu.jpeg";
    }
    else if (condition.includes("大雨")) {
      url = "../../image/dayu.jpg";
    }
    else if (condition.includes("暴雨")) {
      url = "../../image/dayu.jpg";
    }
    else if (condition.includes("阵雪")) {
      url = "../../image/xue.jpeg";
    }
    else if (condition.includes("小雪")) {
      url = "../../image/xue.jpeg";
    }
    else if (condition.includes("中雪")) {
      url = "../../image/baoxue.jpg";
    }
    else if (condition.includes("大雪")) {
      url = "../../image/baoxue.jpg";
    }
    else if (condition.includes("暴雪")) {
      url = "../../image/baoxue.jpg";
    }
    else if (condition.includes("雾")) {
      url = "../../image/wu.jpeg";
    }
    else if (condition.includes("霾")) {
      url = "../../image/wumai.jpg";
    }
    else if (condition.includes("沙尘暴")) {
      url = "../../image/shachenbao.jpg";
    }
    else {
      url = "../../image/unknown.png";
    }
    return url;
  },

  //天气图标路径
  getIconURL: function (weatherDesc) {
    var condition = String(weatherDesc);
    // console.log(condition);
    var url = "";
    if (condition.includes("转")) {
      condition = condition.substring(0, condition.indexOf("转"));
    }

    if (condition.includes("晴")) {
      url = "../../image/sunny.png";
    }
    else if (condition.includes("多云")) {
      url = "../../image/partly_cloudy.png";
    }
    else if (condition.includes("阴")) {
      url = "../../image/cloudy.png";
    }
    else if (condition.includes("阵雨")) {
      url = "../../image/shower.png";
    }
    else if (condition.includes("雷阵雨")) {
      url = "../../image/stormy_rain.png";
    }
    else if (condition.includes("雨夹雪")) {
      url = "../../image/snow_rain.png";
    }
    else if (condition.includes("小雨")) {
      url = "../../image/light_rain.png";
    }
    else if (condition.includes("中雨")) {
      url = "../../image/moderate_rain.png";
    }
    else if (condition.includes("大雨")) {
      url = "../../image/heavy_rain.png";
    }
    else if (condition.includes("暴雨")) {
      url = "../../image/rainstorm.png";
    }
    else if (condition.includes("阵雪")) {
      url = "../../image/shower_snow.png";
    }
    else if (condition.includes("小雪")) {
      url = "../../image/light_snow.png";
    }
    else if (condition.includes("中雪")) {
      url = "../../image/moderate_snow.png";
    }
    else if (condition.includes("大雪")) {
      url = "../../image/heavy_snow.png";
    }
    else if (condition.includes("暴雪")) {
      url = "../../image/snow_storm.png";
    }
    else if (condition.includes("雾")) {
      url = "../../image/fog.png";
    }
    else if (condition.includes("霾")) {
      url = "../../image/haze.png";
    }
    else if (condition.includes("沙尘暴")) {
      url = "../../image/dust_storm.png";
    }
    else {
      url = "../../image/unknown.png";
    }
    return url;
  },

  //转换温度范围显示格式，eg:"7 ~ -2℃"
  tempSwitch: function (temp) {
    var low;
    var high;
    var result;
    var flag = temp.indexOf("~");
    var length = temp.length;

    low = temp.substring(flag + 2, length - 1);
    high = temp.substring(0, flag - 1);
    result = low + " ~ " + high + "℃";

    return result;
  },

  //最近3天天气预报中调整日期显示
  getForecatDate: function (index, weekday) {
    var date = this.getNextDate(index + 1);
    var result;
    result = date + " " + weekday;
    return result;
  },
  getNextDate: function (index) {
    var today = new Date();
    //后index天的日期
    var nextDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 * index);
    var month = nextDate.getMonth() + 1;
    var strDate = nextDate.getDate();
    if (month >= 1 && month <= 9) {
      month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
      strDate = "0" + strDate;
    }
    var result = month + "月" + strDate + "日";
    return result;
  },

  //获取风向
  getWindDeriction: function (wind) {
    var result = "";
    var index = this.seperateWind(wind);
    //信息中不包含风速，风向为全部信息
    if (index == -1) {
      result = wind;
    }
    //信息中包含风速，截取出风向
    else {
      result = wind.substring(0, index);
    }
    return result;
  },

  //获取风速
  getWindSpeed: function (wind) {
    var result = "";
    var index = this.seperateWind(wind);
    //信息中不包含风速，风速为空
    if (index == -1) {
      result = "";
    }
    //信息中包含风速，截取出风速
    else {
      result = wind.substring(index, wind.length);
    }
    return result;
  },

  //将风向和风力分开，获得分隔的索引值
  seperateWind: function (wind) {
    var numPattern = /[0-9]/;
    var result = "";
    if (numPattern.test(wind)) {
      //风力信息中包含数字
      var pattern = new RegExp("[0-9]+");
      var res = wind.match(pattern);
      result = res.index;
    }
    else if (wind.search("微风")) {
      var res = wind.match("微风");
      result = res.index;
    }
    else {
      //风力信息中不包含数字
      result = -1;
    }
    return result;
  },

  //获得输入框中的文字
  inputing: function (e) {
    this.setData({ inputCity: e.detail.value });
  },

  //查询按钮
  bindSearch: function () {
    if (this.data.inputCity == '') {
      wx.showModal({
        title: '提示',
        content: '请先输入要查询的城市名称',
        confirmText: '好的',
        confirmColor: '#ACB4E3',
        showCancel: false,
      });
    }
    else {
      //查询天气
      this.getWeather(this.data.inputCity);

      // 一键回到顶部
      this.setData({
        topNum: 0
      });
    }
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})