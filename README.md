# UI-tests

## Описание

Этот проект предназначен для автоматизации UI-тестирования Electron-приложений с использованием Playwright и Storybook. В репозитории содержатся примеры тестов, конфигурации Storybook, а также вспомогательные скрипты для запуска и визуальной регрессии.

## Структура проекта

- `electron-app/` — исходный код Electron-приложения
- `UI-tests-electron/storybook-electron/` — тесты, конфигурации Storybook и Playwright

## Установка

1. Клонируйте репозиторий:
   ```zsh
   git clone <repo-url>
   cd UI-tests
   ```
2. Установите зависимости для основного приложения и тестовой части:
   ```zsh
   cd electron-app && npm install
   cd ../UI-tests-electron/storybook-electron && npm install
   ```

## Запуск приложения

1. Запустите Electron-приложение:
   ```zsh
   cd electron-app
   npm start
   ```
2. Запустите Storybook для тестирования компонентов:
   ```zsh
   cd ../UI-tests-electron/storybook-electron
   npm run storybook
   ```

## Тестирование

- Для запуска визуальных тестов Playwright:
  ```zsh
  cd UI-tests-electron/storybook-electron
  npm run test
  ```