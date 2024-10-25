# MongoDB_CAP_Test
Скрипты для тестирования MongoDB на соответствие CAP теоремы.

Bat-файлы позволяют запустить и проинициализоровать replica set MongoDB для Windows.

Replica set состоит из 3 узлов mongod:
1. local:29001
2. local:29002
3. local:29003

**Порядок инициализации:**
1. Установите MongoDB Community Edition на Windows: https://www.mongodb.com/try/download/community-edition
2. Проверьте пути, по которому установили MongoDB в файлике **_paths.bat**
3. Запустите 3 узла Mongodb командным файлом **rs_1_start.bat**
4. Создайте Replica set командным файлом **rs_5_build.bat**
5. Подключитесь к Replica set командным файлом **rs_3_connect.bat**

Тесты для проверки свойств MongoDB перечислены в файле **mongodb_test.js**, при запуске консоли автоматически подгружаются функции, находящиеся в файле **rs_prepare.js**
