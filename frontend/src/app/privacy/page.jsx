import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="bg-support-100 rounded-lg flex flex-col text-center gap-2 p-4 m-8">
        <h2>Политика конфиденциальности</h2>
        <h2>Дата вступления в силу: 01.12.2024</h2>
        <p>
          1.Введение. Добро пожаловать в Euro Cosmetics. Мы ценим вашу
          конфиденциальность и стремимся защитить ваши личные данные. Эта
          Политика конфиденциальности описывает, как мы относимся к вашим
          данным.
        </p>
        <p>
          2. Сбор информации. Euro Cosmetics не собирает, не хранит и не
          обрабатывает никакую личную информацию о пользователях нашего
          Приложения. Мы не собираем данные, такие как ваше имя, контактные
          данные или информацию об использовании Приложения.
        </p>
        <p>
          3. Использование информации Поскольку мы не собираем никакую личную
          информацию, мы не используем ее и не обрабатываем для каких-либо
          целей.
        </p>
        <p>
          4. Передача и раскрытие информации Поскольку мы не собираем личную
          информацию, мы не передаем и не раскрываем никакие данные третьим
          лицам.
        </p>
        <p>
          5. Безопасность данных Поскольку наше Приложение не собирает личные
          данные, мы не предпринимаем дополнительных мер безопасности для их
          защиты. Мы все равно стремимся обеспечивать безопасность Приложения в
          целом.
        </p>
        <p>
          6. Изменения в Политике конфиденциальности Мы можем обновлять эту
          Политику конфиденциальности время от времени. Все изменения будут
          опубликованы в этом документе с указанием даты вступления в силу. Мы
          рекомендуем периодически проверять эту страницу для получения
          актуальной информации.
        </p>
        <p>
          7. Контактная информация Если у вас есть вопросы или комментарии по
          поводу этой Политики конфиденциальности, пожалуйста, свяжитесь с нами
          по адресу:{" "}
          <Link
            href="mailto:info@alemtilsimat.com"
            className="underline text-primary"
          >
            info@alemtilsimat.com
          </Link>
        </p>
      </div>
      <div className="bg-support-100 rounded-lg flex flex-col text-center gap-2 p-4 m-8 mt-2">
        <h2>Privacy Policy</h2>
        <h2>Effective Date: 01.12.2024</h2>
        <p>
          1. Introduction. Welcome to Euro Cosmetics. We value your privacy and
          are committed to protecting your personal data. This Privacy Policy
          outlines how we handle your data.
        </p>
        <p>
          2. Information Collection. Euro Cosmetics does not collect, store, or
          process any personal information about users of our Application. We do
          not gather data such as your name, contact details, or information
          about your use of the Application.
        </p>
        <p>
          3. Use of Information. Since we do not collect any personal
          information, we do not use or process it for any purpose.
        </p>
        <p>
          4. Sharing and Disclosure of Information. As we do not collect
          personal information, we do not share or disclose any data to third
          parties.
        </p>
        <p>
          5. Data Security. Since our Application does not collect personal
          data, we do not implement additional security measures for protecting
          such data. Nonetheless, we strive to ensure the overall security of
          the Application.
        </p>
        <p>
          6. Changes to the Privacy Policy. We may update this Privacy Policy
          from time to time. All changes will be published in this document with
          the effective date specified. We recommend periodically reviewing this
          page for up-to-date information.
        </p>
        <p>
          7. Contact Information. If you have any questions or comments
          regarding this Privacy Policy, please contact us at:{" "}
          <Link
            href="mailto:info@alemtilsimat.com"
            className="underline text-primary"
          >
            info@alemtilsimat.com
          </Link>
        </p>
      </div>
    </>
  );
}
