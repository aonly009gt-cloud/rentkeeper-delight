import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'th' | 'shan';

const translations = {
  // Layout & Navigation
  'app.title': { th: '🏘️ จัดการห้องเช่า', shan: '🏘️ ၸတ်းၵၢၼ်ႇႁွင်ႈၶဝ်ႈယူႇ' },
  'nav.rooms': { th: '🏠 ห้องพัก', shan: '🏠 ႁွင်ႈ' },
  'nav.invoice': { th: '🧾 ใบแจ้งหนี้', shan: '🧾 ၸႅင်ႈၼီႈ' },
  'nav.report': { th: '📊 รายงาน', shan: '📊 လၢႆးငၢၼ်း' },
  'nav.settings': { th: '⚙️ ตั้งค่า', shan: '⚙️ တင်ႈၶႃႈ' },

  // Index page
  'month.label': { th: '📅', shan: '📅' },
  'alert.billing': { th: '🔔 แจ้งเตือนเก็บค่าเช่า!', shan: '🔔 ၸႅင်ႈပၼ်ၶဝ်ႈယူႇ!' },
  'alert.unpaid': { th: 'ห้องยังไม่ชำระ', shan: 'ႁွင်ႈဢမ်ႇပႆႇၸၢႆႇ' },
  'rooms.empty': { th: 'ยังไม่มีห้องในเดือนนี้', shan: 'ပႆႇမီးႁွင်ႈၼႂ်းလိူၼ်ၼႆႉ' },
  'rooms.addHint': { th: 'กดปุ่ม + เพื่อเพิ่มห้อง', shan: 'ၼဵၵ်း + တွၼ်ႈတႃႇၽိူမ်ႉႁွင်ႈ' },

  // Room Card
  'room.rent': { th: '🏠 ค่าเช่า', shan: '🏠 ၵႃႈၶဝ်ႈ' },
  'room.electricity': { th: 'ค่าไฟ', shan: 'ၵႃႈၾႆး' },
  'room.water': { th: 'ค่าน้ำ', shan: 'ၵႃႈၼမ်ႉ' },
  'room.total': { th: '💰 รวม', shan: '💰 လုမ်း' },
  'room.paid': { th: 'ชำระแล้ว', shan: 'ၸၢႆႇယဝ်ႉ' },
  'room.unpaid': { th: 'ค้างชำระ', shan: 'ပႆႇၸၢႆႇ' },
  'room.edit': { th: 'แก้ไข', shan: 'မူၼ်ႈ' },
  'room.deleteConfirm': { th: 'ต้องการลบห้องนี้?', shan: 'တေၶႂ်ႈမွတ်ႇႁွင်ႈၼႆႉၶႃႈႁိုဝ်?' },
  'room.unit': { th: 'หน่วย', shan: 'ႁူဝ်ႁႃႈ' },

  // Room Form
  'form.addRoom': { th: '➕ เพิ่มห้องใหม่', shan: '➕ ၽိူမ်ႉႁွင်ႈမႂ်ႇ' },
  'form.editRoom': { th: '✏️ แก้ไขห้อง', shan: '✏️ မူၼ်ႈႁွင်ႈ' },
  'form.roomName': { th: '🏠 ชื่อห้อง *', shan: '🏠 ၸိုဝ်ႈႁွင်ႈ *' },
  'form.roomNamePlaceholder': { th: 'เช่น ห้อง 101', shan: 'မိူၼ် ႁွင်ႈ 101' },
  'form.tenantName': { th: '👤 ชื่อผู้เช่า', shan: '👤 ၸိုဝ်ႈၵူၼ်းၶဝ်ႈ' },
  'form.tenantNamePlaceholder': { th: 'ชื่อผู้เช่า', shan: 'ၸိုဝ်ႈၵူၼ်းၶဝ်ႈ' },
  'form.rent': { th: '💵 ค่าเช่า (บาท)', shan: '💵 ၵႃႈၶဝ်ႈ (ဝၢတ်ႈ)' },
  'form.prevMeter': { th: '⚡ มิเตอร์ก่อนหน้า', shan: '⚡ မီႇတိူဝ်ႇၵဝ်ႇ' },
  'form.currMeter': { th: '⚡ มิเตอร์ปัจจุบัน', shan: '⚡ မီႇတိူဝ်ႇမႂ်ႇ' },
  'form.waterCost': { th: '💧 ค่าน้ำ (บาท)', shan: '💧 ၵႃႈၼမ်ႉ (ဝၢတ်ႈ)' },
  'form.note': { th: '📝 หมายเหตุ', shan: '📝 မၢႆတွၼ်ႈ' },
  'form.notePlaceholder': { th: 'หมายเหตุเพิ่มเติม...', shan: 'မၢႆတွၼ်ႈၽိူမ်ႉ...' },
  'form.moveInDate': { th: '📅 วันเริ่มเช่า', shan: '📅 ဝၼ်းတႄႇၶဝ်ႈ' },
  'form.save': { th: '💾 บันทึก', shan: '💾 မၢႆဝႆႉ' },
  'form.add': { th: '➕ เพิ่มห้อง', shan: '➕ ၽိူမ်ႉႁွင်ႈ' },

  // Invoice
  'invoice.title': { th: '🧾 ใบแจ้งหนี้', shan: '🧾 ၸႅင်ႈၼီႈ' },
  'invoice.header': { th: '🧾 ใบแจ้งหนี้ค่าเช่า', shan: '🧾 ၸႅင်ႈၼီႈၵႃႈၶဝ်ႈ' },
  'invoice.month': { th: 'ประจำเดือน', shan: 'ပဵၼ်လိူၼ်' },
  'invoice.room': { th: 'ห้อง', shan: 'ႁွင်ႈ' },
  'invoice.tenant': { th: 'ผู้เช่า', shan: 'ၵူၼ်းၶဝ်ႈ' },
  'invoice.totalAmount': { th: '💰 รวมทั้งสิ้น', shan: '💰 ႁူမ်ႈတင်းမူတ်း' },
  'invoice.paymentInfo': { th: '🏦 ข้อมูลการชำระเงิน', shan: '🏦 ၶေႃႈမုၼ်းၸၢႆႇငိုၼ်း' },
  'invoice.bank': { th: 'ธนาคาร', shan: 'ထၢၼ်ႇၼႃႇၶႃး' },
  'invoice.accountNo': { th: 'เลขบัญชี', shan: 'မၢႆပၢၼ်ႊၶီႊ' },
  'invoice.accountName': { th: 'ชื่อบัญชี', shan: 'ၸိုဝ်ႈပၢၼ်ႊၶီႊ' },
  'invoice.scanQR': { th: 'สแกน QR Code เพื่อชำระเงิน', shan: 'သၵႅၼ်ႊ QR Code တွၼ်ႈတႃႇၸၢႆႇငိုၼ်း' },
  'invoice.deadline': { th: '⏰ กรุณาชำระภายใน {days} วัน นับจากวันที่ได้รับใบแจ้งหนี้', shan: '⏰ ၶႅၼ်းၸၢႆႇၼႂ်း {days} ဝၼ်း ၼပ်ႉတႄႇဝၼ်းလႆႈႁပ်ႉၸႅင်ႈၼီႈ' },
  'invoice.thanks': { th: 'ขอบคุณครับ/ค่ะ 🙏', shan: 'ၶွပ်ႈၸႂ်ၶႃႈ 🙏' },
  'invoice.selectRoom': { th: '🏠 เลือกห้องเพื่อออกใบแจ้งหนี้', shan: '🏠 လိူၵ်ႈႁွင်ႈတွၼ်ႈတႃႇဢွၵ်ႇၸႅင်ႈၼီႈ' },
  'invoice.selectPrompt': { th: 'เลือกห้องเพื่อดูใบแจ้งหนี้', shan: 'လိူၵ်ႈႁွင်ႈတွၼ်ႈတႃႇတူၺ်းၸႅင်ႈၼီႈ' },
  'invoice.noRooms': { th: 'ยังไม่มีห้องในเดือนนี้', shan: 'ပႆႇမီးႁွင်ႈၼႂ်းလိူၼ်ၼႆႉ' },
  'invoice.print': { th: '🖨️ พิมพ์ / บันทึก PDF', shan: '🖨️ ဢိတ်ႇ / မၢႆဝႆႉ PDF' },

  // Report
  'report.title': { th: '📊 รายงานสรุปรายเดือน', shan: '📊 လၢႆးငၢၼ်းလိူၼ်' },
  'report.income': { th: '💰 รายได้เดือนนี้', shan: '💰 ငိုၼ်းၶဝ်ႈလိူၼ်ၼႆႉ' },
  'report.pending': { th: '⏳ ยอดค้างชำระ', shan: '⏳ ယွတ်ႈပႆႇၸၢႆႇ' },
  'report.paidRooms': { th: '✅ ชำระแล้ว', shan: '✅ ၸၢႆႇယဝ်ႉ' },
  'report.unpaidRooms': { th: '❌ ยังไม่ชำระ', shan: '❌ ပႆႇၸၢႆႇ' },
  'report.baht': { th: 'บาท', shan: 'ဝၢတ်ႈ' },
  'report.roomUnit': { th: 'ห้อง', shan: 'ႁွင်ႈ' },
  'report.chartIncome': { th: '📈 รายได้ย้อนหลัง', shan: '📈 ငိုၼ်းၶဝ်ႈၶိုၼ်းလင်' },
  'report.chartPayment': { th: '🥧 สัดส่วนการชำระเดือนนี้', shan: '🥧 သူၼ်ႇသုၼ်ႇၸၢႆႇလိူၼ်ၼႆႉ' },
  'report.noData': { th: 'ยังไม่มีข้อมูล เพิ่มห้องเพื่อดูรายงาน', shan: 'ပႆႇမီးၶေႃႈမုၼ်း ၽိူမ်ႉႁွင်ႈတွၼ်ႈတႃႇတူၺ်းလၢႆးငၢၼ်း' },
  'report.incomeLabel': { th: 'รายได้', shan: 'ငိုၼ်းၶဝ်ႈ' },

  // Settings
  'settings.title': { th: '⚙️ ตั้งค่าระบบ', shan: '⚙️ တင်ႈၶႃႈလွၵ်းၵၢၼ်' },
  'settings.dormInfo': { th: '🏘️ ข้อมูลหอพัก', shan: '🏘️ ၶေႃႈမုၼ်းႁေႃ' },
  'settings.dormName': { th: 'ชื่อหอพัก', shan: 'ၸိုဝ်ႈႁေႃ' },
  'settings.billingDay': { th: '📅 วันเก็บค่าเช่า (วันที่)', shan: '📅 ဝၼ်းၵဵပ်းၵႃႈၶဝ်ႈ (ဝၼ်းတီႈ)' },
  'settings.deadlineDays': { th: '⏰ ชำระภายในกี่วัน (หลังได้รับใบแจ้งหนี้)', shan: '⏰ ၸၢႆႇၼႂ်းလၢႆဝၼ်း (ဝၢႆးလႆႈႁပ်ႉၸႅင်ႈၼီႈ)' },
  'settings.rates': { th: '💵 อัตราค่าบริการเริ่มต้น', shan: '💵 ဢူဝ်ၵႃႈၸႂ်ႉတႄႇ' },
  'settings.defaultRent': { th: '🏠 ค่าเช่า (บาท/เดือน)', shan: '🏠 ၵႃႈၶဝ်ႈ (ဝၢတ်ႈ/လိူၼ်)' },
  'settings.electricityRate': { th: '⚡ ค่าไฟ (บาท/หน่วย)', shan: '⚡ ၵႃႈၾႆး (ဝၢတ်ႈ/ႁူဝ်ႁႃႈ)' },
  'settings.waterCost': { th: '💧 ค่าน้ำ (บาท/เดือน)', shan: '💧 ၵႃႈၼမ်ႉ (ဝၢတ်ႈ/လိူၼ်)' },
  'settings.bankInfo': { th: '🏦 ข้อมูลบัญชีธนาคาร', shan: '🏦 ၶေႃႈမုၼ်းပၢၼ်ႊၶီႊထၢၼ်ႇၼႃႇၶႃး' },
  'settings.bankName': { th: 'ชื่อธนาคาร', shan: 'ၸိုဝ်ႈထၢၼ်ႇၼႃႇၶႃး' },
  'settings.bankNamePlaceholder': { th: 'เช่น กสิกรไทย', shan: 'မိူၼ် KBank' },
  'settings.accountNumber': { th: 'เลขบัญชี', shan: 'မၢႆပၢၼ်ႊၶီႊ' },
  'settings.accountNumberPlaceholder': { th: 'xxx-x-xxxxx-x', shan: 'xxx-x-xxxxx-x' },
  'settings.accountNameLabel': { th: 'ชื่อบัญชี', shan: 'ၸိုဝ်ႈပၢၼ်ႊၶီႊ' },
  'settings.accountNamePlaceholder': { th: 'ชื่อเจ้าของบัญชี', shan: 'ၸိုဝ်ႈၸဝ်ႈပၢၼ်ႊၶီႊ' },
  'settings.qrCode': { th: '📱 QR Code พร้อมเพย์', shan: '📱 QR Code PromptPay' },
  'settings.uploadQR': { th: 'อัปโหลด QR Code', shan: 'ဢပ်ႇလူတ်ႇ QR Code' },
  'settings.save': { th: '💾 บันทึกการตั้งค่า', shan: '💾 မၢႆဝႆႉတင်ႈၶႃႈ' },
  'settings.saveSuccess': { th: '✅ บันทึกการตั้งค่าเรียบร้อย!', shan: '✅ မၢႆဝႆႉတင်ႈၶႃႈယဝ်ႉ!' },
  'settings.fileTooLarge': { th: 'ไฟล์ใหญ่เกิน 2MB', shan: 'ၾၢႆႇလူင်ပူၼ်ႉ 2MB' },
  'settings.language': { th: '🌐 ภาษา', shan: '🌐 ၽႃႇသႃႇ' },
  'settings.logout': { th: '🚪 ออกจากระบบ', shan: '🚪 ဢွၵ်ႇလွၵ်းၵၢၼ်' },

  // Auth
  'auth.loginSubtitle': { th: 'เข้าสู่ระบบเพื่อจัดการห้องเช่า', shan: 'ၶဝ်ႈလွၵ်းၵၢၼ်တွၼ်ႈတႃႇၸတ်းၵၢၼ်ႇႁွင်ႈ' },
  'auth.signupSubtitle': { th: 'สมัครสมาชิกเพื่อเริ่มใช้งาน', shan: 'သမၵ်ႇသမႃးတွၼ်ႈတႃႇတႄႇၸႂ်ႉ' },
  'auth.email': { th: '📧 อีเมล', shan: '📧 ဢီးမဵဝ်ႇ' },
  'auth.password': { th: '🔑 รหัสผ่าน', shan: '🔑 မၢႆလပ်ႉ' },
  'auth.login': { th: 'เข้าสู่ระบบ', shan: 'ၶဝ်ႈလွၵ်းၵၢၼ်' },
  'auth.signup': { th: 'สมัครสมาชิก', shan: 'သမၵ်ႇသမႃး' },
  'auth.switchToSignup': { th: 'ยังไม่มีบัญชี? สมัครที่นี่', shan: 'ပႆႇမီးပၢၼ်ႊၶီႊ? သမၵ်ႇတီႈၼႆႈ' },
  'auth.switchToLogin': { th: 'มีบัญชีแล้ว? เข้าสู่ระบบ', shan: 'မီးပၢၼ်ႊၶီႊယဝ်ႉ? ၶဝ်ႈလွၵ်းၵၢၼ်' },
  'auth.loginError': { th: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', shan: 'ဢီးမဵဝ်ႇ ဢမ်ႇၼၼ် မၢႆလပ်ႉ ဢမ်ႇမႅၼ်ႈ' },
  'auth.signupError': { th: 'ไม่สามารถสมัครได้ ลองใหม่อีกครั้ง', shan: 'ဢမ်ႇၸၢင်ႈသမၵ်ႇ ၶတ်းၸႂ်ထႅင်ႈ' },
  'auth.signupSuccess': { th: 'สมัครสำเร็จ! กรุณายืนยันอีเมลแล้วเข้าสู่ระบบ', shan: 'သမၵ်ႇယဝ်ႉ! ၶႅၼ်းယိုၼ်ယၼ်ဢီးမဵဝ်ႇသေၶဝ်ႈလွၵ်းၵၢၼ်' },
  'auth.passwordMin': { th: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', shan: 'မၢႆလပ်ႉလူဝ်ႇမီးယေႈပွၵ်ႈ 6 တူဝ်' },

  // Tenant Details
  'tenant.title': { th: '📋 ข้อมูลผู้เช่า', shan: '📋 ၶေႃႈမုၼ်းၵူၼ်းၶဝ်ႈ' },
  'tenant.basicInfo': { th: 'ข้อมูลพื้นฐาน', shan: 'ၶေႃႈမုၼ်းငဝ်ႈ' },
  'tenant.name': { th: '👤 ชื่อผู้เช่า', shan: '👤 ၸိုဝ်ႈၵူၼ်းၶဝ်ႈ' },
  'tenant.namePlaceholder': { th: 'ชื่อ-นามสกุล', shan: 'ၸိုဝ်ႈ-ၼႃႇမသၵုၼ်ႇ' },
  'tenant.phone': { th: 'เบอร์โทร', shan: 'မၢႆၾူၼ်း' },
  'tenant.occupantCount': { th: 'จำนวนผู้เช่า (คน)', shan: 'ၵူၼ်းၶဝ်ႈ (ၵေႃႉ)' },
  'tenant.people': { th: 'คน', shan: 'ၵေႃႉ' },
  'tenant.idCard': { th: 'บัตรประชาชน', shan: 'ဝႂ်ၵူၼ်းမိူင်း' },
  'tenant.idCardNumber': { th: 'เลขบัตรประชาชน', shan: 'မၢႆဝႂ်ၵူၼ်းမိူင်း' },
  'tenant.idCardImage': { th: 'รูปบัตรประชาชน', shan: 'ႁၢင်ႈဝႂ်ၵူၼ်းမိူင်း' },
  'tenant.uploadIdCard': { th: 'อัปโหลดรูปบัตร', shan: 'ဢပ်ႇလူတ်ႇႁၢင်ႈဝႂ်' },
  'tenant.uploading': { th: 'กำลังอัปโหลด...', shan: 'ၵိုင်ႉၵၢင်ႉဢပ်ႇလူတ်ႇ...' },
  'tenant.uploadSuccess': { th: '✅ อัปโหลดสำเร็จ', shan: '✅ ဢပ်ႇလူတ်ႇယဝ်ႉ' },
  'tenant.uploadError': { th: '❌ อัปโหลดไม่สำเร็จ', shan: '❌ ဢပ်ႇလူတ်ႇဢမ်ႇလႆႈ' },
  'tenant.deleteSuccess': { th: '🗑️ ลบรูปสำเร็จ', shan: '🗑️ မွတ်ႇႁၢင်ႈယဝ်ႉ' },
  'tenant.fileTooLarge': { th: 'ไฟล์ใหญ่เกิน 5MB', shan: 'ၾၢႆႇလူင်ပူၼ်ႉ 5MB' },
  'tenant.addressSection': { th: 'ที่อยู่', shan: 'တီႈယူႇ' },
  'tenant.address': { th: '🏡 ที่อยู่ภูมิลำเนา', shan: '🏡 တီႈယူႇ' },
  'tenant.addressPlaceholder': { th: 'บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด', shan: 'မၢႆႁိူၼ်း တၢင်း ဢိူင်ႇ ၸေႈဝဵင်း ၸေႈတွၼ်ႈ' },
  'tenant.emergencySection': { th: 'ผู้ติดต่อฉุกเฉิน', shan: 'ၵူၼ်းၵပ်းသၢၼ်ႇသုၵ်ႉ' },
  'tenant.emergencyContact': { th: '🆘 ชื่อผู้ติดต่อฉุกเฉิน', shan: '🆘 ၸိုဝ်ႈၵူၼ်းၵပ်းသၢၼ်ႇသုၵ်ႉ' },
  'tenant.emergencyContactPlaceholder': { th: 'ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน', shan: 'ၸိုဝ်ႈၵူၼ်းၵပ်းသၢၼ်ႇသုၵ်ႉ' },
  'tenant.emergencyPhone': { th: '📱 เบอร์ฉุกเฉิน', shan: '📱 မၢႆၾူၼ်းသုၵ်ႉ' },
  'tenant.save': { th: '💾 บันทึกข้อมูลผู้เช่า', shan: '💾 မၢႆဝႆႉၶေႃႈမုၼ်းၵူၼ်းၶဝ်ႈ' },
  'tenant.saveSuccess': { th: '✅ บันทึกข้อมูลผู้เช่าเรียบร้อย!', shan: '✅ မၢႆဝႆႉၶေႃႈမုၼ်းယဝ်ႉ!' },
  'tenant.addPerson': { th: '➕ เพิ่มผู้เช่า', shan: '➕ ၽိူမ်ႉၵူၼ်းၶဝ်ႈ' },
  'tenant.personLabel': { th: 'ผู้เช่าคนที่', shan: 'ၵူၼ်းၶဝ်ႈၵေႃႉတီႈ' },
  'tenant.deleteConfirm': { th: 'ต้องการลบผู้เช่าคนนี้?', shan: 'တေၶႂ်ႈမွတ်ႇၵူၼ်းၶဝ်ႈၵေႃႉၼႆႉၶႃႈႁိုဝ်?' },
  'tenant.noTenants': { th: 'ยังไม่มีข้อมูลผู้เช่า กดเพิ่มผู้เช่า', shan: 'ပႆႇမီးၶေႃႈမုၼ်းၵူၼ်းၶဝ်ႈ ၼဵၵ်းၽိူမ်ႉ' },
  'tenant.loading': { th: 'กำลังโหลด...', shan: 'ၵိုင်ႉၵၢင်ႉလူတ်ႇ...' },
  'tenant.info': { th: 'ข้อมูลผู้เช่า', shan: 'ၶေႃႈမုၼ်းၵူၼ်းၶဝ်ႈ' },
  'form.meterError': { th: '⚠️ เลขมิเตอร์ปัจจุบันต้องไม่น้อยกว่ามิเตอร์ก่อนหน้า', shan: '⚠️ မီႇတိူဝ်ႇမႂ်ႇလူဝ်ႇဢမ်ႇလူတ်ႇၵဝ်ႇ' },

  // Payment Slip
  'payment.notify': { th: '📤 แจ้งชำระเงิน', shan: '📤 ၸႅင်ႈၸၢႆႇငိုၼ်း' },
  'payment.title': { th: '📤 แจ้งชำระเงิน', shan: '📤 ၸႅင်ႈၸၢႆႇငိုၼ်း' },
  'payment.description': { th: 'อัปโหลดรูปสลิปการโอนเงิน', shan: 'ဢပ်ႇလူတ်ႇႁၢင်ႈသလိပ်ႇ' },
  'payment.selectImage': { th: 'เลือกรูปสลิป', shan: 'လိူၵ်ႈႁၢင်ႈသလိပ်ႇ' },
  'payment.changeImage': { th: 'เปลี่ยนรูป', shan: 'ပိၼ်ႇႁၢင်ႈ' },
  'payment.submit': { th: '📤 ส่งหลักฐานการชำระ', shan: '📤 သူင်ႇလၵ်းထၢၼ်' },
  'payment.uploading': { th: 'กำลังอัปโหลด...', shan: 'ၵိုင်ႉၵၢင်ႉဢပ်ႇလူတ်ႇ...' },
  'payment.uploadSuccess': { th: '✅ ส่งหลักฐานเรียบร้อย!', shan: '✅ သူင်ႇလၵ်းထၢၼ်ယဝ်ႉ!' },
  'payment.uploadError': { th: '❌ อัปโหลดไม่สำเร็จ', shan: '❌ ဢပ်ႇလူတ်ႇဢမ်ႇလႆႈ' },
  'payment.submitted': { th: 'ส่งหลักฐานเรียบร้อย!', shan: 'သူင်ႇလၵ်းထၢၼ်ယဝ်ႉ!' },
  'payment.pendingReview': { th: 'รอเจ้าของหอพักตรวจสอบ', shan: 'ပႂ်ႉၸဝ်ႈႁေႃၵူတ်ႇ' },
  'payment.close': { th: 'ปิด', shan: 'ပိၵ်ႉ' },
  'payment.pending': { th: '⏳ รอตรวจสอบ', shan: '⏳ ပႂ်ႉၵူတ်ႇ' },
  'payment.viewSlip': { th: '🧾 ดูสลิป', shan: '🧾 တူၺ်းသလိပ်ႇ' },
  'payment.confirmPaid': { th: '✅ ยืนยันชำระแล้ว', shan: '✅ ယိုၼ်ယၼ်ၸၢႆႇယဝ်ႉ' },
  'payment.rejectSlip': { th: '❌ ไม่อนุมัติ', shan: '❌ ဢမ်ႇၽွမ်ႉ' },
  'payment.slipRejected': { th: 'สลิปไม่ถูกต้อง / ถูกปฏิเสธ', shan: 'သလိပ်ႇဢမ်ႇမႅၼ်ႈ / ထုၵ်ႇထဵင်' },

  // E-Lease & E-Signature
  'lease.title': { th: '📄 สัญญาเช่า', shan: '📄 လိၵ်ႈမၼ်ႈၸႂ်' },
  'lease.create': { th: 'สร้างร่างสัญญาเช่า', shan: 'ႁဵတ်းလိၵ်ႈမၼ်ႈၸႂ်မႂ်ႇ' },
  'lease.share': { th: 'แชร์ให้ผู้เช่าเซ็น', shan: 'သူင်ႇလဵင်ႉပၼ်ၵူၼ်းၶဝ်ႈသႅၼ်းၸိုဝ်ႈ' },
  'lease.signed': { th: 'ลงนามแล้ว', shan: 'သႅၼ်းၸိုဝ်ႈယဝ်ႉ' },
  'lease.view': { th: 'ดูเอกสารสัญญา', shan: 'တူၺ်းလိၵ်ႈမၼ်ႈၸႂ်' },
  'lease.signHere': { th: 'เซ็นชื่อที่นี่', shan: 'သႅၼ်းၸိုဝ်ႈတီႈၼႆႈ' },
  'lease.clearSignature': { th: 'ล้างลายเซ็น', shan: 'မွတ်ႇလၢႆးသႅၼ်း' },
  'lease.saveSignature': { th: 'บันทึกลายเซ็น', shan: 'မၢႆဝႆႉလၢႆးသႅၼ်း' },

  // Inspection
  'inspection.checkRoom': { th: 'ตรวจห้อง', shan: 'ၵူတ်ႇႁွင်ႈ' },
  'inspection.title': { th: '📝 ตรวจสภาพห้อง', shan: '📝 ၵူတ်ႇသၽႃႇဝႁွင်ႈ' },
  'inspection.moveIn': { th: 'ย้ายเข้า', shan: 'ၶၢႆႉၶဝ်ႈ' },
  'inspection.moveOut': { th: 'ย้ายออก', shan: 'ၶၢႆႉဢွၵ်ႇ' },
  'inspection.normal': { th: 'ปกติ', shan: 'ပူၵ်ႉၵတေႉ' },
  'inspection.damaged': { th: 'ชำรุด/มีตำหนิ', shan: 'လူႉလႅဝ်/မီးမၢႆ' },
  'inspection.addPhoto': { th: 'เพิ่มรูปภาพ', shan: 'ၽိူမ်ႉႁၢင်ႈ' },
  'inspection.remark': { th: 'หมายเหตุ', shan: 'မၢႆတွၼ်ႈ' },
  'inspection.saveReport': { th: 'บันทึกรายงาน', shan: 'မၢႆဝႆႉလၢႆးငၢၼ်း' },

  // Announcements
  'broadcast.announce': { th: 'ประกาศ', shan: 'ပိုၼ်ၽၢဝ်ႇ' },
  'broadcast.title': { th: '📢 ส่งประกาศแจ้งเตือนลูกบ้าน', shan: '📢 သူင်ႇပိုၼ်ၽၢဝ်ႇထိုင်ၵူၼ်းၶဝ်ႈ' },
  'broadcast.message': { th: 'ข้อความประกาศ', shan: 'ၶေႃႈၵႂၢမ်းပိုၼ်ၽၢဝ်ႇ' },
  'broadcast.send': { th: 'ส่งประกาศ (LINE)', shan: 'သူင်ႇပိုၼ်ၽၢဝ်ႇ (LINE)' },

  // Expenses
  'expense.title': { th: '🧾 บันทึกรายจ่าย', shan: '🧾 မၢႆဝႆႉၵႃႈၸၢႆႇ' },
  'expense.add': { th: 'เพิ่มรายจ่าย', shan: 'ၽိူမ်ႉၵႃႈၸၢႆႇ' },
  'expense.edit': { th: 'แก้ไขรายจ่าย', shan: 'မူၼ်ႈၵႃႈၸၢႆႇ' },
  'expense.date': { th: 'วันที่', shan: 'ဝၼ်းတီႈ' },
  'expense.name': { th: 'ชื่อรายการ', shan: 'ၸိုဝ်ႈလၢႆးၵၢၼ်' },
  'expense.amount': { th: 'จำนวนเงิน (บาท)', shan: 'ၼမ်ႉငိုၼ်း (ဝၢတ်ႈ)' },
  'expense.category': { th: 'หมวดหมู่', shan: 'ပိူင်ထၢၼ်' },
  'expense.cancel': { th: 'ยกเลิก', shan: 'ဢမ်ႇႁဵတ်း' },
  'expense.save': { th: 'บันทึก', shan: 'မၢႆဝႆႉ' },
  'expense.netProfit': { th: 'กำไรสุทธิ', shan: 'ၼမ်ႉမျၢတ်ႈ' },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      return (saved === 'shan' ? 'shan' : 'th') as Language;
    } catch {
      return 'th';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const entry = translations[key];
    if (!entry) return key;
    let text: string = entry[language] || entry['th'];
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
