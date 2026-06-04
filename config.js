// Biểu tượng và ID cấu hình hệ thống
const AQUA_COIN = '<:aqua_coin:1510213859393404958>';
const TICKET_EMOJI = '🎟️';
const ADMIN_ID = '1458325185806471230';
const STAFF_IDS = ['1343927777128349807', '1510623240580497470'];

// Cấu hình Nông trại
const CROP_DATA = {
  'Cà Rốt': { seedPrice: 5000, sellPrice: 8000, time: 15 * 60 * 1000, exp: 5 },
  'Dâu Tây': { seedPrice: 10000, sellPrice: 16000, time: 30 * 60 * 1000, exp: 10 },
  'Bắp': { seedPrice: 20000, sellPrice: 32000, time: 60 * 60 * 1000, exp: 20 },
  'Bí Ngô': { seedPrice: 50000, sellPrice: 90000, time: 120 * 60 * 1000, exp: 40 },
  'Dứa': { seedPrice: 120000, sellPrice: 220000, time: 240 * 60 * 1000, exp: 80 },
  'Hoa Hồng': { seedPrice: 300000, sellPrice: 600000, time: 480 * 60 * 1000, exp: 150 },
  'Hoa Pha Lê': { seedPrice: 500000, sellPrice: 1200000, time: 1440 * 60 * 1000, exp: 500 }
};

// Cấu hình Ma Sói
const MA_SOI_ROLES = {
  'dan thuong': { name: 'Dân Thường', side: 'Dân Làng', win: 'Diệt sạch Ma Sói và Phe Thứ Ba độc hại.', skill: 'Không có kỹ năng đặc biệt ban đêm, dùng lý luận vào ban ngày để treo cổ kẻ tình nghi.' },
  'tien tri': { name: 'Tiên Tri', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Mỗi đêm soi một người để xem họ có phải Ma Sói hay không.' },
  'bao ve': { name: 'Bảo Vệ', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Mỗi đêm chọn một người để bảo vệ khỏi sự tấn công của Ma Sói. Không thể bảo vệ một người 2 đêm liên tiếp.' },
  'phu thuy': { name: 'Phù Thủy', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Sở hữu 1 bình thuốc cứu người sống lại và 1 bình thuốc độc giết chết một người bất kỳ trong đêm.' },
  'tho san': { name: 'Thợ Săn', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Khi bị cắn hoặc bị treo cổ chết, có quyền chọn bắn chết thêm một người chơi khác mang theo.' },
  'thi truong': { name: 'Thị Trưởng', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Phiếu biểu quyết treo cổ ban ngày của Thị Trưởng được tính là 2 phiếu.' },
  'hiep si thanh': { name: 'Hiệp Sĩ Thánh', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Miễn nhiễm với phát cắn đầu tiên của Ma Sói vào ban đêm.' },
  'gia lang': { name: 'Già Làng', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Có 2 mạng trước Ma Sói. Nếu Già Làng bị Dân Làng treo cổ chết, tất cả các vai trò quyền năng của phe Dân Làng sẽ mất đi kỹ năng.' },
  'than tinh yeu': { name: 'Thần Tình Yêu', side: 'Dân Làng', win: 'Theo phe Dân Làng (Trừ khi tự liên kết thành cặp đôi khác phe thì win theo cặp đôi).', skill: 'Đêm đầu tiên kết đôi 2 người chơi. Nếu một người chết, người còn lại sẽ chết theo vì đau buồn.' },
  'co be ty ty': { name: 'Cô Bé Ty Ty', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Có thể hé mắt nhìn trộm trong đêm xem ai là Ma Sói (Kỹ năng nguy hiểm dễ bị Sói phát hiện).' },
  'thay phap': { name: 'Thầy Pháp', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Mỗi đêm có thể chọn một người để làm phép cách ly tiếng động, bảo vệ họ khỏi kỹ năng nguyền rủa.' },
  'dan lang oan han': { name: 'Dân Làng Oán Hận', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'If bị treo cổ oan, linh hồn oán hận sẽ lập tức tước đi quyền biểu quyết của người bỏ phiếu cho mình vào ngày tiếp theo.' },
  'ke phan boi': { name: 'Kẻ Phản Bội', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Được tính là phe Dân khi kiểm tra, nhưng nắm giữ danh tính của một vài vị trí khác.' },
  'nua nguoi nua soi': { name: 'Nửa Người Nửa Sói', side: 'Dân Làng', win: 'Thắng cùng Dân Làng cho đến khi bị Sói cắn sẽ biến thành Sói thực thụ.', skill: 'Tiên tri soi ra Dân Làng, nhưng khi bị Sói chọn cắn ban đêm sẽ không chết mà tiến hóa thành Ma Sói.' },
  'hiep si mu': { name: 'Hiệp Sĩ Mù', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Mỗi đêm có thể chọn lao ra kiếm chém ngẫu nhiên một người, nếu trúng Sói thì Sói chết, trúng Dân thì Hiệp sĩ chết.' },
  'ke khung bo': { name: 'Kẻ Khủng Bố', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Có thể bí mật chế tạo một quả bom ban đêm, nếu bị chọn treo cổ sẽ kích nổ kéo theo người chỉ định.' },
  'ke bat chuoc': { name: 'Kẻ Bắt Chước', side: 'Dân Làng', win: 'Tùy thuộc vào vai trò mục tiêu mà bản thân chọn bắt chước.', skill: 'Đêm đầu chọn một người chơi, nếu người đó chết, bản thân sẽ thừa kế toàn bộ vai trò của người đó.' },
  'nguoi hoc viec': { name: 'Người Học Việc', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Thừa kế chức năng của Tiên Tri nếu Tiên Tri đương nhiệm bị sát hại.' },
  'nguoi theu det loi the': { name: 'Người Thêu Dệt Lời Thề', side: 'Dân Làng', win: 'Diệt sạch Ma Sói/Phe Thứ Ba.', skill: 'Khóa liên kết lời thề của 2 người, ép họ phải bỏ phiếu giống nhau vào ban ngày.' },
  'ma soi': { name: 'Ma Sói', side: 'Ma Sói', win: 'Số lượng Ma Sói bằng hoặc lớn hơn số lượng Dân Làng còn sống.', skill: 'Mỗi đêm cùng phe Sói thức giấc chọn cắn chết một người chơi.' },
  'soi con': { name: 'Sói Con', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Khi Sói Con bị treo cổ hoặc bị giết ban ngày, phe Ma Sói sẽ phẫn nộ và được cắn liền 2 người vào đêm hôm sau.' },
  'soi dau dan': { name: 'Sói Đầu Đàn', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Phiếu cắn người ban đêm của Sói Đầu Đàn được tính trọng số là 2 phiếu.' },
  'soi sat thu': { name: 'Sói Sát Thủ', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Một lần trong trận đấu, có thể chọn cắn xuyên qua lớp bảo vệ của Bảo Vệ hoặc Hiệp Sĩ Thánh.' },
  'soi cam lang': { name: 'Sói Câm Lặng', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Mỗi đêm chọn một người chơi, người đó sẽ bị cấm chat hoàn toàn vào ban ngày hôm sau.' },
  'soi gian diep': { name: 'Sói Gián Điệp', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Mỗi đêm soi một người để biết chính xác vai trò chức năng của họ là gì.' },
  'soi lua': { name: 'Sói Lửa', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Khi bị chết, thiêu rụi một góc làng khiến người chơi bên cạnh mất kỹ năng vào đêm tiếp theo.' },
  'soi sao chep': { name: 'Sói Sao Chép', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Chọn sao chép kỹ năng phụ trợ của một người dân làng đã chết.' },
  'soi cam hoa': { name: 'Sói Cảm Hóa', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Có thể chọn thu phục một người dân thường biến thành đồng minh của phe Sói.' },
  'soi ho ve': { name: 'Sói Hộ Vệ', side: 'Ma Sói', win: 'Phe Ma Sói thắng.', skill: 'Bảo vệ một thành viên Sói khác khỏi bị phù thủy đầu độc ban đêm.' },
  'tham phan': { name: 'Thẩm Phán', side: 'Phe Thứ Ba', win: 'Sống sót đến cuối trận đấu một mình.', skill: 'Mỗi ngày có quyền bí mật cho phép bỏ phiếu treo cổ lần 2 nếu lần 1 không ai chết.' },
  'dao tac': { name: 'Đạo Tặc', side: 'Phe Thứ Ba', win: 'Cướp và thắng theo vai trò mới.', skill: 'Đêm đầu tiên đổi vai trò của mình với một vai trò không được sử dụng trong bộ bài ngẫu nhiên.' },
  'soi trang': { name: 'Sói Trắng', side: 'Phe Thứ Ba', win: 'Trở thành người sống sót duy nhất.', skill: 'Cứ mỗi 2 đêm, Sói Trắng có quyền thức giấc riêng tư cắn chết thêm một con Ma Sói thường khác.' },
  'ke chan doi': { name: 'Kẻ Chán Đời', side: 'Phe Thứ Ba', win: 'Bị Dân Làng biểu quyết treo cổ chết vào ban ngày.', skill: 'Không có kỹ năng ban đêm, mục tiêu duy nhất là làm mọi cách lừa Dân Làng treo cổ mình.' },
  'ma ca rong': { name: 'Ma Cà Ròng', side: 'Phe Thứ Ba', win: 'Hút máu tiêu diệt cả Dân Làng lẫn Ma Sói.', skill: 'Mỗi đêm gieo rắc dấu ấn hút máu lên một người, dấu ấn nổ tung giết chết họ sau 2 đêm.' },
  'ke an trom': { name: 'Kẻ Ăn Trộm', side: 'Phe Thứ Ba', win: 'Giữ vai trò trộm được.', skill: 'Đánh cắp vật phẩm hoặc chức năng tạm thời của một người chơi ban đêm.' },
  'giao chu': { name: 'Giáo Chủ', side: 'Phe Thứ Ba', win: 'Thu phục tất cả người còn sống vào Giáo phái của mình.', skill: 'Mỗi đêm thu nạp một người vào giáo hội. Khi tất cả người sống đều là môn đồ, Giáo Chủ thắng.' },
  'ke thu thap linh hon': { name: 'Kẻ Thu Thập Linh Hồn', side: 'Phe Thứ Ba', win: 'Tích lũy đủ 4 linh hồn người chết.', skill: 'Mỗi khi có người chết, bản thân thu về 1 linh hồn giúp gia tăng thể trạng.' },
  'ke doi mau': { name: 'Kẻ Đổi Màu', side: 'Phe Thứ Ba', win: 'Thay đổi tùy theo trạng thái.', skill: 'Đổi phe linh hoạt theo số lượng người chơi chiếm đa số tại thời điểm quy định.' },
  'tran quy': { name: 'Trăn Quỷ', side: 'Phe Thứ Ba', win: 'Nuốt chửng toàn bộ làng.', skill: 'Mỗi 3 đêm nuốt chửng hoàn toàn một người chơi làm họ biến mất khỏi trò chơi không để lại vết tích.' },
  'ke cuop danh tinh': { name: 'Kẻ Cướp Danh Tính', side: 'Phe Thứ Ba', win: 'Sát hại mục tiêu và thế chỗ.', skill: 'Chọn một người, nếu người đó bị chết ban đêm, bạn ngay lập tức thừa hưởng tên và avatar của họ.' },
  'ky sinh trung': { name: 'Ký Sinh Trùng', side: 'Phe Thứ Ba', win: 'Vật chủ sống sót cuối cùng.', skill: 'Bám ký sinh vào một người chơi, sử dụng mạng sống của họ để đỡ đòn hộ mình.' },
  'ke thoi mien': { name: 'Kẻ Thôi Miên', side: 'Phe Thứ Ba', win: 'Bắt tất cả người chơi tự bỏ phiếu treo cổ chính họ.', skill: 'Thôi miên ép một người phải đưa ra phiếu bầu theo ý thích cá nhân của mình.' },
  'ac quy': { name: 'Ác Quỷ', side: 'Phe Thứ Ba', win: 'Tạo ra kỷ nguyên bóng tối hủy diệt.', skill: 'Gieo rắc lời nguyền bóng tối phá hủy kỹ năng vĩnh viễn của một vị trí chức năng.' },
  'anh tu': { name: 'Ảnh Tử', side: 'Phe Thứ Ba', win: 'Sao chép bóng ma và chiến thắng đơn độc.', skill: 'Ẩn nấp dưới bóng của người khác, sử dụng mạng sống của họ để đỡ đòn hộ mình.' }
};

module.exports = { AQUA_COIN, TICKET_EMOJI, ADMIN_ID, STAFF_IDS, CROP_DATA, MA_SOI_ROLES };


