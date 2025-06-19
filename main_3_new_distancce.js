const jsPsych = initJsPsych({display_element: 'jspsych-experiment'});

// ---------- 1. 信息收集 ----------
const subject_info = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<h3>实验登记</h3><p>请输入如下信息（所有项必填）：</p>',
  html: `
    <label>被试编号：<input name="subject_id" type="text" required></label><br><br>
    <label>姓名：<input name="name" type="text" required></label><br><br>
    <label>年龄：<input name="age" type="number" min="1" max="120" required></label><br><br>
    <label>性别：<input name="gender" type="radio" value="1" required> 男
           <input name="gender" type="radio" value="2" required> 女</label><br>
  `,
  button_label: '提交',
  data: {task: 'subject_info'}
};

// ---------- 2. 全屏与指导语 ----------
const experiment_instruction = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="text-align:center;">
      <h3>实验须知</h3>
      <p>本实验大约持续20分钟，请保证周围环境安静、不受干扰。<br>
      实验开始后会自动进入全屏。如需中途退出，请按ESC键（中途退出不会保存数据）。</p>
    </div>
  `,
  choices: ['确认，进入实验']
};

const enter_fullscreen = {
  type: jsPsychFullscreen,
  fullscreen_mode: true,
  message: '<p>接下来实验将自动全屏。请点击下方按钮开始。</p>',
  button_label: '开始全屏'
};

const task2_instruction = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="text-align:center;">
      <h3>任务2指导语</h3>
      <p>身份识别实验<br>
      每个回合，你会看到一个人向你接近。<br>
      你可以滑动图片下方的滑块，来调整这个人与你之间的距离。<br>
      请将图片停在你认为最舒适的距离。</p>
    </div>
  `,
  choices: ['继续']
};

const distance_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      const img_files = ['20m.jpg','15m.jpg','10m.jpg','5m.jpg','0m.jpg'];
      const img_dir = 'static/stimuli/distance/';
      return `
        <style>
          .fullpage-img {
            width: 100vw;
            height: 100vh;
            object-fit: contain;
            background: #111;
            display:block;
            margin:0 auto;
          }
          .distance-label {
            position: absolute;
            top: 3vh;
            left: 0;
            width: 100vw;
            text-align: center;
            color: #fff;
            font-size: 2.4em;
            text-shadow: 0 0 5px #000;
            z-index:99;
            pointer-events:none;
          }
          #distance-key-hint {
            position: absolute;
            bottom: 4vh;
            width: 100vw;
            left: 0;
            text-align: center;
            font-size: 1.2em;
            color: #fff;
            z-index:101;
            pointer-events:none;
          }
        </style>
        <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:98;">
          <span class="distance-label" id="distance-label">20米</span>
          <img id="distance-image" class="fullpage-img" src="${img_dir}${img_files[0]}" />
          <div id="distance-key-hint">
            按↑或↓键切换距离，按空格键确认选择
          </div>
        </div>
      `;
    },
    choices: [' '], // 只允许空格键结束
    response_ends_trial: true,
    on_load: function() {
      const img_files = ['20m.jpg','15m.jpg','10m.jpg','5m.jpg','0m.jpg'];
      const distances = [20,15,10,5,0];
      const img_dir = 'static/stimuli/distance/';
      let idx = 0; // 当前图片下标
  
      const img = document.getElementById('distance-image');
      const label = document.getElementById('distance-label');
  
      function update() {
        img.src = img_dir + img_files[idx];
        label.textContent = distances[idx] + '米';
      }
  
      // 键盘监听
      document.addEventListener('keydown', function handler(e) {
        if(jsPsych.pluginAPI.compareKeys(e.key, 'ArrowUp')) {
          if(idx > 0) {
            idx -= 1;
            update();
          }
          e.preventDefault();
        } else if(jsPsych.pluginAPI.compareKeys(e.key, 'ArrowDown')) {
          if(idx < img_files.length-1) {
            idx += 1;
            update();
          }
          e.preventDefault();
        }
        // 只要trial还在，空格交由jsPsych处理，别拦截
      });
  
      // jsPsych的cleanup机制：trial结束时移除事件
      this._keydown_handler_cleanup = function() {
        document.removeEventListener('keydown', handler, false);
      };
      jsPsych.pluginAPI.registerPreload('image', img_files.map(fn => img_dir+fn), 'image');
    },
    on_finish: function(data) {
      const img_files = ['20m.jpg','15m.jpg','10m.jpg','5m.jpg','0m.jpg'];
      const distances = [20,15,10,5,0];
      // 记录最终图片和距离
      // 通过label获取当前idx
      let idx = 0;
      try {
        let t = document.getElementById('distance-label').textContent;
        idx = distances.indexOf(parseInt(t));
      } catch(e) {}
      data.selected_index = idx;
      data.selected_image = img_files[idx];
      data.selected_distance = distances[idx];
    }
  };
  
  // 3. 结束 trial
  const end_message_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="text-align:center;">
        <h2>实验结束</h2>
        <p>感谢您的参与！</p>
      </div>
    `,
    choices: ['关闭页面']
  };
  
  // 4. timeline
  let timeline = [
    subject_info,
    experiment_instruction,
    enter_fullscreen,
    task2_instruction,
    distance_trial,
    end_message_trial
  ];
  
  // 5. 运行
  jsPsych.run(timeline);