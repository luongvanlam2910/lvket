import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điều khoản dịch vụ</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Cập nhật lần cuối: Tháng 1, 2024</Text>
        
        <Text style={styles.paragraph}>
          Chào mừng bạn đến với LVket! Các Điều khoản Dịch vụ ("Điều khoản") này quy định việc sử dụng ứng dụng di động và dịch vụ của chúng tôi.
        </Text>

        <Text style={styles.heading}>1. Chấp nhận Điều khoản</Text>
        <Text style={styles.paragraph}>
          Bằng việc truy cập hoặc sử dụng LVket, bạn đồng ý tuân theo các Điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, bạn không thể sử dụng dịch vụ.
        </Text>

        <Text style={styles.heading}>2. Tài khoản Người dùng</Text>
        <Text style={styles.paragraph}>
          Bạn có trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình. Bạn đồng ý chịu trách nhiệm cho tất cả hoạt động diễn ra dưới tài khoản của bạn.
        </Text>

        <Text style={styles.heading}>3. Nội dung Người dùng</Text>
        <Text style={styles.paragraph}>
          Bạn giữ quyền sở hữu đối với bất kỳ nội dung nào bạn đăng tải. Bằng việc đăng nội dung, bạn cấp cho chúng tôi quyền sử dụng, chỉnh sửa và hiển thị nội dung đó liên quan đến dịch vụ.
        </Text>

        <Text style={styles.heading}>4. Hành vi Bị cấm</Text>
        <Text style={styles.paragraph}>
          Bạn không được sử dụng dịch vụ để:
        </Text>
        <Text style={styles.bullet}>• Đăng nội dung bất hợp pháp, có hại hoặc xúc phạm</Text>
        <Text style={styles.bullet}>• Quấy rối, lạm dụng hoặc gây hại cho người dùng khác</Text>
        <Text style={styles.bullet}>• Vi phạm bất kỳ luật hoặc quy định hiện hành nào</Text>

        <Text style={styles.heading}>5. Quyền riêng tư</Text>
        <Text style={styles.paragraph}>
          Việc sử dụng dịch vụ của bạn cũng được điều chỉnh bởi Chính sách Bảo mật của chúng tôi. Vui lòng xem Chính sách Bảo mật để hiểu các thực hành của chúng tôi.
        </Text>

        <Text style={styles.heading}>6. Chấm dứt</Text>
        <Text style={styles.paragraph}>
          Chúng tôi có thể chấm dứt hoặc tạm ngưng tài khoản của bạn ngay lập tức, không cần thông báo trước, nếu chúng tôi tin rằng bạn vi phạm các Điều khoản này.
        </Text>

        <Text style={styles.heading}>7. Thay đổi Điều khoản</Text>
        <Text style={styles.paragraph}>
          Chúng tôi có quyền sửa đổi các Điều khoản này bất kỳ lúc nào. Chúng tôi sẽ thông báo cho người dùng về bất kỳ thay đổi nào bằng cách cập nhật ngày "Cập nhật lần cuối".
        </Text>

        <Text style={styles.heading}>8. Liên hệ</Text>
        <Text style={styles.paragraph}>
          Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng liên hệ với chúng tôi tại support@lvket.app
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

