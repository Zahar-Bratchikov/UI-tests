import React from 'react';

// Пример компонента для тестирования
export const Button = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button onClick={onClick}>{label}</button>
);

// Пример stories для Button
export default {
  title: 'UI/Button',
  component: Button,
};

export const Default = () => <Button label="Default" />;
export const WithAction = () => <Button label="Click me" onClick={() => alert('Clicked!')} />;
