import React, { useState } from 'react';

function UserForm({ onSubmit }) {
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [module, setModule] = useState('SKT');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name, department, module });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Enter Your Information</h1>
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <input
                type="text"
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
            />
            <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                required
            >
                <option value="SKT">SKT</option>
                <option value="PKT">PKT</option>
            </select>
            <button type="submit">Start Quiz</button>
        </form>
    );
}

export default UserForm;
