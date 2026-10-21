function intervalLabel(days) {return days<1?`${Math.round(days*1440)} phút`:`${Number(days.toFixed(1))} ngày`;}
function memoryDate(t){return Number.isFinite(t)?new Date(t).toLocaleString('vi-VN'):'Chưa có';}
