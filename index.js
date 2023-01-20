'use strict';

/*
1ノーツあたりのスコア = 
Math.floor(
  Math.floor(
    バンド総合力 * 3 * {(楽曲の難易度 - 5) * 0.01 + 1}
    / 総ノーツ数 * タイミング判定係数 * コンボ係数
  )
* スキルボーナス
)
*/

//inputデータ
const input = require('./input_scoreranking_mixnuts.json');

//タイミング判定係数
const PERFECT_RATE = 1.1;
const GREAT_RATE = 0.8;
const GOOD_RATE = 0.5;
const BAD_RATE = 0;
const MISS_RATE = 0;

//PERFECTごとにX%増えるスキルボーナスの割合
const EVERY_P_05 = 0.5;

//PERFECTごとにX%増えるスキルボーナスが含まれているかを示すフラグ(全体であるかどうか)
let skill_bonus_everyp_all_f = false;

//PERFECTごとにX%増えるスキルボーナスのカードかを示すフラグ(1枚1枚のカードで変更)
let skill_bonus_everyp_f = false;

//PERFECTごとにX%増えるスキルボーナスの現在の値
let current_everyp05_skill_bonus = 100;

//コンボ係数(境界値も含まれる)
const COMBO_20 = 20, COMBO_LESS_20_RATE = 1;
const COMBO_50 = 50, COMBO_LESS_50_RATE = 1.01;
const COMBO_100 = 100, COMBO_LESS_100_RATE = 1.02;
const COMBO_150 = 150, COMBO_LESS_150_RATE = 1.03;
const COMBO_200 = 200, COMBO_LESS_200_RATE = 1.04;
const COMBO_250 = 250, COMBO_LESS_250_RATE = 1.05;
const COMBO_300 = 300, COMBO_LESS_300_RATE = 1.06;
const COMBO_400 = 400, COMBO_LESS_400_RATE = 1.07;
const COMBO_500 = 500, COMBO_LESS_500_RATE = 1.08;
const COMBO_600 = 600, COMBO_LESS_600_RATE = 1.09;
const COMBO_700 = 700, COMBO_LESS_700_RATE = 1.10;
const COMBO_MORE_700_RATE = 1.11;

//バンド総合力
const total_band_score = input.total_band_score;
//楽曲の難易度
const music_level = input.music_level;
//総ノーツ数
const total_notes = input.total_notes;

//Gノーツ(スキル内外問わず)
let g_notes = [];

//スキルの配列(全パターン)
let skillorder = [];

//リーダースキル
let leaderskill;

//スキル外のスコア(固定)
let fixed_score = 0;

//スキル順と最終スコアの連想配列
let skillorder_finalscore = [];

//スキル順序を全通り作成
//引数；スキルの配列
function createSkillOrder(head, rest) {

    if (rest.length === 0) {
      return [head];
  
    } else {
      var res = [];
  
      //重複削除
      var data = rest.filter(function (x, y, self) {
        return self.indexOf(x) === y;
      });
  
      for (var i = 0; i < data.length; i++) {
  
        //配列の複製
        var restx = rest.slice(0);
  
        //指定データ削除
        for (var j = 0; j < restx.length; j++) {
          if (restx[j] == data[i]) {
            restx.splice(j, 1);
            break;
          }
        }
  
        var headx = head.concat(data[i]);
        res = res.concat(createSkillOrder(headx, restx));
      }
      return res;
    }
}

//初期化
function init(){
    let skillarr = [];
    for(let i = 0; i < input.card.length; i++){
        skillarr.push(input.card[i].skill);
    }
    //全スキル順の配列
    skillorder = createSkillOrder([], skillarr);

    //Gノーツ
    for(let i = 0; i < input.g_notes.length; i++){
        g_notes.push(input.g_notes[i].notes);
    }
}

//1ノーツあたりのスコア計算に渡す加点率の数値を返す
function skillStringToNumber(skill){
    let skillnumber = skill;
    if(typeof(skill) == "string"){
        //100+がリーダーの場合も計算するためフラグをON
        skill_bonus_everyp_f = true;
        skill_bonus_everyp_all_f = true;
        skillnumber = Number(skill.split('+')[0]);
    }else{
        //100+のカードであるフラグオフ
        skill_bonus_everyp_f = false;
    }
    return skillnumber;
}

//リーダースキル判定
function setLeaderSkill(){
    let skillordernumber = [];
    for (let i = 0; i < skillorder[0].length; i++){
        const skillnumber = skillStringToNumber(skillorder[0][i]);
        skillordernumber.push(skillnumber);
    }
    leaderskill = Math.max(...skillordernumber);
    console.log("リーダースキルを、"+leaderskill+"として計算します。");
}


//Gの時の加点率を返す
function gSkill(skill){
    let cardskill = input.card.find((v) => v.skill == skill);
    return cardskill.g_skill;
}

//コンボ係数を返す
//param
//current_note:現在のコンボ数
//return
//combo_rate:コンボ係数
function getComboRate(current_note){

    let combo_rate = 0;
    if (current_note <= COMBO_20) {
        combo_rate = COMBO_LESS_20_RATE;
    } else if (current_note > COMBO_20 && current_note <= COMBO_50) {
        combo_rate = COMBO_LESS_50_RATE;
    } else if (current_note > COMBO_50 && current_note <= COMBO_100){
        combo_rate = COMBO_LESS_100_RATE;
    } else if (current_note > COMBO_100 && current_note <= COMBO_150){
        combo_rate = COMBO_LESS_150_RATE;
    } else if (current_note > COMBO_150 && current_note <= COMBO_200){
        combo_rate = COMBO_LESS_200_RATE;
    } else if (current_note > COMBO_200 && current_note <= COMBO_250){
        combo_rate = COMBO_LESS_250_RATE;
    } else if (current_note > COMBO_250 && current_note <= COMBO_300){
        combo_rate = COMBO_LESS_300_RATE;
    } else if (current_note > COMBO_300 && current_note <= COMBO_400){
        combo_rate = COMBO_LESS_400_RATE;
    } else if (current_note > COMBO_400 && current_note <= COMBO_500){
        combo_rate = COMBO_LESS_500_RATE;
    } else if (current_note > COMBO_500 && current_note <= COMBO_600){
        combo_rate = COMBO_LESS_600_RATE;
    } else if (current_note > COMBO_600 && current_note <= COMBO_700){
        combo_rate = COMBO_LESS_700_RATE;
    } else if (current_note > COMBO_700){
        combo_rate = COMBO_MORE_700_RATE;
    }

    return combo_rate;
}


//1ノーツあたりのスコア計算(スキル外)
//param
//total_band_score:バンド総合力
//music_level:楽曲の難易度
//total_notes:総ノーツ数
//current_combo:現在のコンボ数
function calcOneNoteScoreOutsideSkill(total_band_score, music_level, total_notes, current_note){

    const combo_rate = getComboRate(current_note);
    let judge_rate = PERFECT_RATE;

    //G判定
    if(g_notes.includes(current_note)){
        judge_rate = GREAT_RATE;
    }  

    const result = Math.floor(
        total_band_score * 3 * (((music_level - 5) * 0.01 + 1) * (1/total_notes)) * judge_rate * combo_rate);
    
    return result;
}

//スコアの計算(スキル外)
function calcFixedScore(){
    
    let totalscore = 0;
    const skill_bonus = 1;

    //1〜s1前まで
    for(let i = 1; i < input.skill_s_to_e[0].start; i++) {
        const score_before_s1 = calcOneNoteScoreOutsideSkill(total_band_score, music_level, total_notes, i, skill_bonus);
        totalscore = totalscore + score_before_s1;
    }
    //S6後~最後
    for(let i = input.skill_s_to_e[5].end + 1; i <= total_notes; i++) {
        const score_after_s6 = calcOneNoteScoreOutsideSkill(total_band_score, music_level, total_notes, i, skill_bonus);
        totalscore = totalscore + score_after_s6;
    }

    //それ以外
    for(let j = 0; j <= 4; j++){
        for(let i = input.skill_s_to_e[j].end + 1; i < input.skill_s_to_e[j+1].start; i++) {
            const score = calcOneNoteScoreOutsideSkill(total_band_score, music_level, total_notes, i, skill_bonus);
            totalscore = totalscore + score;
        }
    }

    fixed_score = totalscore;

}

//1ノーツあたりのスコア計算(スキル内)
//param
//total_band_score:バンド総合力
//music_level:楽曲の難易度
//total_notes:総ノーツ数
//current_combo:現在のコンボ数
//skill_bonus:スキルボーナス
function calcOneNoteScoreInsideSkill(total_band_score, music_level, total_notes, current_note, skill_bonus){

    const combo_rate = getComboRate(current_note);
    let judge_rate = PERFECT_RATE;
    let result = 0;

    //G判定
    if(g_notes.includes(current_note)){
        judge_rate = GREAT_RATE;
    }

    const inner_calc = Math.floor(
        total_band_score * 3 * (((music_level - 5) * 0.01 + 1) * (1/total_notes)) * judge_rate * combo_rate);

    //PERFECTごとにスキルボーナスが増える場合(フラグ判定)
    if(skill_bonus_everyp_f){
        current_everyp05_skill_bonus = current_everyp05_skill_bonus + EVERY_P_05;

        const outer_calc = Math.floor(inner_calc * (current_everyp05_skill_bonus / 100));

        result = inner_calc + outer_calc;

    }else{
        //上昇したスキルボーナスの値リセット
        current_everyp05_skill_bonus = 100;
        //一定のスキルボーナスの場合
        const outer_calc = Math.floor(inner_calc * (skill_bonus / 100));
        
        result = inner_calc + outer_calc;
    }

    return result;
}

//スコアの計算(スキル内)
function calcVariableScore(){

    for(let i = 0; i < skillorder.length; i++){
        let innerskillscore = 0;
        let current_skill_order = '';
        for(let j = 0; j < skillorder[i].length; j++){
            
            //S1~S5までのスコア計算
            if(j >= 0 && j <= 4){//S1~S5までの計算
                current_skill_order = current_skill_order + skillorder[i][j] + "→";
                let skill_bonus = skillStringToNumber(skillorder[i][j]);
                let gskill = gSkill(skillorder[i][j]);
                for(let k = input.skill_s_to_e[j].start; k <= input.skill_s_to_e[j].end; k++){
                    let score1 = 0;
                    //Gスキルが0ではなく、g_notesと重なった場合はg_skillを加点率として計算する
                    if (gskill != 0 && g_notes.includes(k)){
                        skill_bonus = gskill;
                        score1 = calcOneNoteScoreInsideSkill(total_band_score, music_level, total_notes, k, skill_bonus);
                    }else if(gskill == 0 && g_notes.includes(k)){//Gスキルが0で、g_notesと重なった場合は、スキル対象外として計算する
                        score1 = calcOneNoteScoreOutsideSkill(total_band_score, music_level, total_notes, k, 1);
                    }else{
                        score1 = calcOneNoteScoreInsideSkill(total_band_score, music_level, total_notes, k, skill_bonus);
                    }
                    innerskillscore = innerskillscore + score1;
                }

                if(j == 4){

                    //上昇したスキルボーナスの値リセット(リーダーに100+を設定した場合)
                    current_everyp05_skill_bonus = 100;
                    //S6のスコア計算
                    for(let k = input.skill_s_to_e[5].start; k <= input.skill_s_to_e[5].end; k++){
                        const score6 = calcOneNoteScoreInsideSkill(total_band_score, music_level, total_notes, k, leaderskill);
                        innerskillscore = innerskillscore + score6;
                    }

                    const final_score = fixed_score + innerskillscore;

                    //上昇したスキルボーナスの値リセット(リーダーに100+を設定した場合)
                    current_everyp05_skill_bonus = 100;

                    const skillorder_finalscore_object = {skillorder: current_skill_order, finalscore: final_score};
                    //スキル順と最終スコアの連想配列をpush
                    skillorder_finalscore.push(skillorder_finalscore_object);
                }
            }
        }
    }
}

//最終スコアを降順に並び替える
function sortFinalScore(){
    skillorder_finalscore.sort((a, b) => b.finalscore - a.finalscore);
    console.log(skillorder_finalscore);
}

//パーフェクトごとにスキルボーナスが上昇するスキルがあるか判定
//true:リーダーにセットし計算
//false:終了
function existSkillBonusEveryp(){
    if(!skill_bonus_everyp_all_f){
        console.log("処理を終了します。")
    }else{
        console.log("リーダーを100+にして再計算します。");
        leaderskill = 100;
        //前回の最終結果をクリア
        skillorder_finalscore = [];
        //スキル内のスコアを計算する(可変値)
        calcVariableScore();
        //最終スコアの降順に並べ替える
        sortFinalScore();
    }
}

//初期化
init();
//リーダースキル判定
setLeaderSkill();
//スキル外のスコアを計算する(固定値)
calcFixedScore();
//スキル内のスコアを計算する(可変値)
calcVariableScore();
//最終スコアの降順に並べ替える
sortFinalScore();

//パーフェクトごとにスキルボーナスが上昇するスキルがあるか判定
existSkillBonusEveryp();

