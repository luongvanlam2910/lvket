import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách Bảo mật</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Cập nhật lần cuối: Tháng 1, 2024</Text>
        
        <Text style={styles.paragraph}>
          Tại LV, chúng tôi coi trọng quyền riêng tư của bạn. Chính sách Bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
        </Text>

        <Text style={styles.heading}>1. Thông tin Chúng tôi Thu thập</Text>
        <Text style={styles.paragraph}>
          Chúng tôi thu thập thông tin bạn cung cấp trực tiếp cho chúng tôi, bao gồm:
        </Text>
        <Text style={styles.bullet}>• Thông tin tài khoản (email, tên người dùng)</Text>
        <Text style={styles.bullet}>• Thông tin hồ sơ và ảnh</Text>
        <Text style={styles.bullet}>• Nội dung bạn đăng (ảnh, story, tin nhắn)</Text>

        <Text style={styles.heading}>2. Cách Chúng tôi Sử dụng Thông tin của Bạn</Text>
        <Text style={styles.paragraph}>
          Chúng tôi sử dụng thông tin thu thập được để:
        </Text>
        <Text style={styles.bullet}>• Cung cấp và cải thiện dịch vụ</Text>
        <Text style={styles.bullet}>• Gửi thông báo và cập nhật cho bạn</Text>
        <Text style={styles.bullet}>• Bảo vệ chống gian lận và lạm dụng</Text>

        <Text style={styles.heading}>3. Chia sẻ Thông tin</Text>
        <Text style={styles.paragraph}>
          Chúng tôi không bán thông tin cá nhân của bạn. Chúng tôi chỉ có thể chia sẻ thông tin của bạn:
        </Text>
        <Text style={styles.bullet}>• Với sự đồng ý của bạn</Text>
        <Text style={styles.bullet}>• Để tuân thủ nghĩa vụ pháp lý</Text>
        <Text style={styles.bullet}>• Để bảo vệ quyền và an toàn của chúng tôi</Text>

        <Text style={styles.heading}>4. Bảo mật Dữ liệu</Text>
        <Text style={styles.paragraph}>
          Chúng tôi thực hiện các biện pháp bảo mật phù hợp để bảo vệ thông tin của bạn. Tuy nhiên, không có phương thức truyền tải qua internet nào an toàn 100%.
        </Text>

        <Text style={styles.heading}>5. Quyền của Bạn</Text>
        <Text style={styles.paragraph}>
          Bạn có quyền:
        </Text>
        <Text style={styles.bullet}>• Truy cập thông tin cá nhân của bạn</Text>
        <Text style={styles.bullet}>• Cập nhật hoặc sửa đổi thông tin của bạn</Text>
        <Text style={styles.bullet}>• Xóa tài khoản và dữ liệu của bạn</Text>

        <Text style={styles.heading}>6. Quyền riêng tư của Trẻ em</Text>
        <Text style={styles.paragraph}>
          Dịch vụ của chúng tôi không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em dưới 13 tuổi.
        </Text>

        <Text style={styles.heading}>7. Thay đổi Chính sách này</Text>
        <Text style={styles.paragraph}>
          Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian. Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi nào bằng cách cập nhật ngày "Cập nhật lần cuối".
        </Text>

        <Text style={styles.heading}>8. Liên hệ</Text>
        <Text style={styles.paragraph}>
          Nếu bạn có câu hỏi về Chính sách Bảo mật này, vui lòng liên hệ với chúng tôi tại privacy@lvket.app
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 15,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginLeft: 10,
    marginBottom: 5,
  },
});

