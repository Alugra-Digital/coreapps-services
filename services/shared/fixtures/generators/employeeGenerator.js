import { faker } from '@faker-js/faker';

export function generateEmployees(count = 100) {
  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Operations', 'Marketing', 'Customer Service', 'R&D'];
  const religions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
  const positions = [
    'Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Engineering Manager',
    'HR Manager', 'HR Specialist', 'Recruiter',
    'Accountant', 'Senior Accountant', 'Finance Manager', 'Financial Analyst',
    'Sales Executive', 'Sales Manager', 'Account Manager',
    'Operations Manager', 'Operations Coordinator',
    'Marketing Manager', 'Digital Marketing Specialist', 'Content Writer',
    'Customer Service Representative', 'Customer Success Manager',
    'Product Manager', 'Business Analyst', 'Data Analyst'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const joinDate = faker.date.past({ years: 5 });
    
    return {
      employeeId: `EMP${String(i + 1).padStart(5, '0')}`,
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.helpers.arrayElement([
        `+62 8${faker.string.numeric(9)}`,
        `+62 8${faker.string.numeric(10)}`,
        `0${faker.string.numeric(10)}`
      ]),
      department: faker.helpers.arrayElement(departments),
      position: faker.helpers.arrayElement(positions),
      salary: faker.number.int({ min: 5000000, max: 50000000 }), // IDR 5M - 50M
      joinDate,
      dateOfBirth: faker.date.birthdate({ min: 22, max: 58, mode: 'age' }),
      gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
      religion: faker.helpers.arrayElement(religions),
      maritalStatus: faker.helpers.arrayElement(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
      address: `${faker.location.streetAddress()}, ${faker.location.city()}`,
      city: faker.location.city(),
      province: faker.helpers.arrayElement([
        'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 
        'Banten', 'Bali', 'Sumatera Utara', 'Sulawesi Selatan'
      ]),
      postalCode: faker.location.zipCode('#####'),
      country: 'Indonesia',
      ktp: faker.string.numeric(16),
      npwp: faker.string.numeric(15),
      bankAccount: faker.finance.accountNumber(10),
      bankName: faker.helpers.arrayElement(['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Permata']),
      bpjsKesehatan: faker.string.numeric(13),
      bpjsKetenagakerjaan: faker.string.numeric(11),
      emergencyContactName: faker.person.fullName(),
      emergencyContactPhone: `+62 8${faker.string.numeric(9)}`,
      emergencyContactRelation: faker.helpers.arrayElement(['Spouse', 'Parent', 'Sibling', 'Child']),
      createdAt: joinDate,
      updatedAt: joinDate
    };
  });
}

export function generateEmployeeWithDependents(count = 50) {
  return Array.from({ length: count }, () => {
    const employee = generateEmployees(1)[0];
    const numDependents = faker.number.int({ min: 0, max: 4 });
    
    employee.dependents = Array.from({ length: numDependents }, () => ({
      name: faker.person.fullName(),
      relationship: faker.helpers.arrayElement(['Spouse', 'Child', 'Parent']),
      dateOfBirth: faker.date.birthdate({ min: 0, max: 65, mode: 'age' }),
      ktp: faker.string.numeric(16)
    }));
    
    return employee;
  });
}
