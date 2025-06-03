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

// ---------- 3. 序列生成函数（与任务1一致） ----------
function generate_sequences(subject_id) {
  let all_sequences = [];
  // selfX部分
  let self_prefix = `static/stimuli/${subject_id}/self${subject_id}_`;
  for (let s of ['A', 'B', 'C', 'D', 'E', 'F']) {
    let seq = [];
    for (let i = 1; i <= 7; i++) {
      seq.push(`${self_prefix}${s}${i}.jpg`);
    }
    all_sequences.push({
      seq_type: 'self',
      seq_name: `self${subject_id}_${s}`,
      imgs: seq
    });
  }
  // common_y部分
  let xInt = parseInt(subject_id);
  let y = (xInt % 4 === 0) ? 0 : xInt % 4;
  let common_prefix = `static/stimuli/common_${y}/`;
  for (let cat of ['cele', 'other', 'own']) {
    for (let s of ['A', 'B', 'C', 'D', 'E', 'F']) {
      let seq = [];
      for (let i = 1; i <= 7; i++) {
        seq.push(`${common_prefix}${cat}_${s}${i}.jpg`);
      }
      all_sequences.push({
        seq_type: cat,
        seq_name: `${cat}_${s}`,
        imgs: seq
      });
    }
  }
  return all_sequences;
}

// ---------- 4. 生成所有图片的试次数组 ----------
function flat_and_shuffle_images(all_sequences) {
  let trials = [];
  all_sequences.forEach(seq => {
    seq.imgs.forEach((img_path, idx) => {
      trials.push({
        img: img_path,
        seq_type: seq.seq_type,
        seq_name: seq.seq_name,
        img_idx: idx+1 // 1~7
      });
    });
  });
  return jsPsych.randomization.shuffle(trials);
}

// ---------- 5. 任务2场景滑块参数 ----------
const canvas_w = 600, canvas_h = 480;
const n_levels = 8;
const labels = ["35m", "30m", "25m", "20m", "15m", "10m", "5m", "1m"];

const top_y_frac = 0.12, bottom_y_frac = 0.93;
const top_w_frac = 0.18, bottom_w_frac = 0.8;

const top_y = canvas_h * top_y_frac;
const bottom_y = canvas_h * bottom_y_frac;
const top_w = canvas_w * top_w_frac;
const bottom_w = canvas_w * bottom_w_frac;

const center_x = canvas_w / 2;
const left_top = {x: center_x - top_w/2, y: top_y};
const right_top = {x: center_x + top_w/2, y: top_y};
const left_bottom = {x: center_x - bottom_w/2, y: bottom_y};
const right_bottom = {x: center_x + bottom_w/2, y: bottom_y};

// ---------- 6. 单个滑块-图片试次的trial生成 ----------
function make_task2_trial(trial_info) {
  return {
    type: jsPsychHtmlSliderResponse,
    stimulus: function(){
      return `
        <div id="perspective-box" style="position:relative;width:${canvas_w}px;height:${canvas_h}px;margin:0 auto;background:#000;">
          <canvas id="perspective-canvas" width="${canvas_w}" height="${canvas_h}" style="display:block;"></canvas>
          <img id="person-img" src="${trial_info.img}" style="position:absolute;left:50%;transform:translateX(-50%);z-index:2;">
        </div>
        <p style="color:black;font-size:22px;text-align:center;margin-top:30px;">滑动滑块来选择最舒适的距离</p>
      `;
    },
    min: 0,
    max: n_levels-1,
    step: 1,
    slider_start: 0,
    labels: labels,
    prompt: "",
    require_movement: false,
    on_load: function(){
      // 画梯形
      const canvas = document.getElementById('perspective-canvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas_w,canvas_h);

      // 梯形轮廓
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left_bottom.x, left_bottom.y);
      ctx.lineTo(left_top.x, left_top.y);
      ctx.lineTo(right_top.x, right_top.y);
      ctx.lineTo(right_bottom.x, right_bottom.y);
      ctx.closePath();
      ctx.stroke();

      // 横线
      ctx.font = "24px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      for(let i=0; i<n_levels; i++){
        const frac = i/(n_levels-1);
        const y = top_y + (bottom_y-top_y)*frac;
        const w = top_w + (bottom_w-top_w)*frac;
        const lx = center_x - w/2;
        const rx = center_x + w/2;
        ctx.beginPath();
        ctx.moveTo(lx, y);
        ctx.lineTo(rx, y);
        ctx.stroke();
        ctx.fillText(labels[i], rx + 16, y + 8);
      }
      ctx.restore();

      // 人像位置与大小
      const img = document.getElementById('person-img');
      function setImgByLevel(idx){
        const frac = idx/(n_levels-1);
        const y = top_y + (bottom_y-top_y)*frac;
        const minPic = canvas_w * 0.10;
        const maxPic = canvas_w * 0.33;
        const w = minPic + (maxPic - minPic) * frac;
        const h = w; // 正方形
        img.style.width = w + "px";
        img.style.height = h + "px";
        img.style.left = "50%";
        img.style.top = (y - h) + 'px';
      }
      setImgByLevel(0);

      const slider = document.querySelector('input[type=range]');
      if(slider && img){
        slider.addEventListener('input', function(){
          setImgByLevel(parseInt(slider.value));
        });
      }
    },
    on_finish: function(data){
      // jsPsych会自动存储rt
      // 可在此自定义其它数据
    },
    data: {
      task: "distance_adjust",
      img: trial_info.img,
      seq_type: trial_info.seq_type,
      seq_name: trial_info.seq_name,
      img_idx: trial_info.img_idx
    }
  };
}

// ---------- 7. 结果表格 ----------
const show_results_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function(){
    // 获取被试信息
    const info = jsPsych.data.get().filter({task: "subject_info"}).values()[0]?.response || {};
    // 获取所有试次
    const trials = jsPsych.data.get().filter({task: "distance_adjust"}).values();
    const display_trials = trials.slice(0, 25);

    let html = `
      <h3>任务2实验结果（前25项）</h3>
      <p>被试编号：${info.subject_id ?? ""} &emsp; 姓名：${info.name ?? ""} &emsp; 年龄：${info.age ?? ""} &emsp; 性别：${info.gender == '1' ? '男' : '女'}</p>
      <table border="1" style="margin:auto; border-collapse:collapse;">
        <tr>
          <th>序号</th>
          <th>图片名称</th>
          <th>滑块位置</th>
          <th>距离标签</th>
          <th>反应时(ms)</th>
        </tr>
    `;
    display_trials.forEach((t, idx) => {
      const img_name = t.img ? t.img.split('/').pop() : '';
      html += `<tr>
        <td>${idx+1}</td>
        <td>${img_name}</td>
        <td>${t.response ?? ""}</td>
        <td>${typeof t.response === "number" ? labels[t.response] : ""}</td>
        <td>${t.rt ?? ""}</td>
      </tr>`;
    });
    html += "</table>";
    html += "<p>点击下方按钮导出全部试次数据（CSV文件）。</p>";
    return html;
  },
  choices: ['导出数据并退出实验'],
  on_finish: function(){
    // 生成CSV并下载
    const trials = jsPsych.data.get().filter({task: "distance_adjust"}).values();
    let csv = "trial,img_name,slider_idx,label,rt(ms)\n";
    trials.forEach((t, idx) => {
      const img_name = t.img ? t.img.split('/').pop() : '';
      csv += [
        idx+1,
        img_name,
        t.response ?? "",
        (typeof t.response === "number" ? labels[t.response] : ""),
        t.rt ?? ""
      ].join(",") + "\n";
    });
    // 文件下载
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "task2_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    jsPsych.endExperiment("实验已结束，感谢您的参与！");
  }
};

// ---------- 8. 主流程 ----------
let all_sequences = [];

let timeline = [
  subject_info,
  {
    timeline: [
      {
        type: jsPsychPreload,
        images: function() {
          const infoTrial = jsPsych.data.get().filter({task: "subject_info"}).values()[0];
          const subject_id = infoTrial && infoTrial.response ? infoTrial.response.subject_id : "X";
          all_sequences = generate_sequences(subject_id);
          // 平铺全部图片
          const all_imgs = all_sequences.flatMap(seq => seq.imgs);
          return all_imgs;
        }
      },
      experiment_instruction,
      enter_fullscreen,
      task2_instruction,
      {
        timeline: [],
        on_timeline_start: function() {
          // 生成所有图片试次
          const trial_infos = flat_and_shuffle_images(all_sequences);
          // 拼接所有滑块trial
          this.timeline.push(...trial_infos.map(trial_info => make_task2_trial(trial_info)));
        }
      },
      show_results_trial
    ]
  }
];

// ---------- 9. 运行 ----------
jsPsych.run(timeline);