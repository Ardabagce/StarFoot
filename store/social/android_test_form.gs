// StarFoot Android test kaydı formunu oluşturur (Google Apps Script).
// script.google.com > Yeni proje > bu kodu yapıştır > Çalıştır (createForm).
// Bitince "Yürütme günlüğü"nde form linki, kısa paylaşım linki ve yanıt tablosu yazar.
function createForm() {
  var form = FormApp.create('StarFoot Android Test Kaydı');
  form.setDescription(
    "StarFoot'u Google Play'de herkesten önce oyna!\n\n" +
    "Play Store'da kullandığın Gmail adresini yaz, seni test listesine ekleyelim. " +
    "Davet linkini Instagram'dan (DM) ya da bu adrese göndereceğiz.\n\n" +
    "Testin geçmesi için oyunu 14 gün telefonunda yüklü tutman yeterli. Ücretsiz."
  );
  form.setCollectEmail(false);
  form.setRequireLogin(false);
  form.setLimitOneResponsePerUser(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    "Teşekkürler, kaydın alındı! ⚽ Seni test listesine ekleyince davet linkini göndereceğiz. " +
    "Linke dokunup \"Test kullanıcısı ol\" deyip oyunu Play Store'dan indirmen yeterli."
  );

  form.addTextItem()
    .setTitle("Play Store'da kullandığın Gmail adresi")
    .setHelpText('Telefonundaki Google Play hesabının adresi olmalı (ör. ad.soyad@gmail.com).')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Geçerli bir e-posta adresi yaz.')
      .requireTextIsEmail()
      .build());

  form.addTextItem()
    .setTitle('Instagram kullanıcı adın')
    .setHelpText('Davet linkini DM ile göndermemiz için (isteğe bağlı).')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Telefon modelin')
    .setHelpText('Ör. Samsung A54, Xiaomi Redmi Note 12 (isteğe bağlı).')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('StarFoot\'u daha önce iPhone\'da oynadın mı?')
    .setChoiceValues(['Evet', 'Hayır, ilk kez oynayacağım'])
    .setRequired(false);

  var sheet = SpreadsheetApp.create('StarFoot Android Test Kaydı (yanıtlar)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('Paylaşım linki: ' + form.shortenFormUrl(form.getPublishedUrl()));
  Logger.log('Formu düzenle: ' + form.getEditUrl());
  Logger.log('Yanıt tablosu: ' + sheet.getUrl());
}
