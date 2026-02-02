import { DataTable, type ColumnDef } from "./components/data-table";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  salary: number;
  joinDate: string;
}

const sampleData: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 95000,
    joinDate: "2022-03-15",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    role: "Designer",
    department: "Design",
    salary: 85000,
    joinDate: "2021-07-22",
  },
  {
    id: 3,
    name: "Carol White",
    email: "carol@example.com",
    role: "Manager",
    department: "Engineering",
    salary: 120000,
    joinDate: "2020-01-10",
  },
  {
    id: 4,
    name: "David Brown",
    email: "david@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 92000,
    joinDate: "2023-02-01",
  },
  {
    id: 5,
    name: "Eve Davis",
    email: "eve@example.com",
    role: "Analyst",
    department: "Finance",
    salary: 78000,
    joinDate: "2022-11-30",
  },
  {
    id: 6,
    name: "Frank Miller",
    email: "frank@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 98000,
    joinDate: "2021-09-14",
  },
  {
    id: 7,
    name: "Grace Lee",
    email: "grace@example.com",
    role: "Designer",
    department: "Design",
    salary: 88000,
    joinDate: "2022-05-20",
  },
  {
    id: 8,
    name: "Henry Wilson",
    email: "henry@example.com",
    role: "Manager",
    department: "Sales",
    salary: 115000,
    joinDate: "2019-08-05",
  },
  {
    id: 9,
    name: "Ivy Chen",
    email: "ivy@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 105000,
    joinDate: "2020-04-12",
  },
  {
    id: 10,
    name: "Jack Taylor",
    email: "jack@example.com",
    role: "Analyst",
    department: "Finance",
    salary: 82000,
    joinDate: "2023-01-15",
  },
  {
    id: 11,
    name: "Karen Martinez",
    email: "karen@example.com",
    role: "Designer",
    department: "Design",
    salary: 90000,
    joinDate: "2021-03-08",
  },
  {
    id: 12,
    name: "Leo Garcia",
    email: "leo@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 97000,
    joinDate: "2022-08-25",
  },
  {
    id: 13,
    name: "Mia Robinson",
    email: "mia@example.com",
    role: "Manager",
    department: "Marketing",
    salary: 118000,
    joinDate: "2020-06-18",
  },
  {
    id: 14,
    name: "Nick Anderson",
    email: "nick@example.com",
    role: "Analyst",
    department: "Finance",
    salary: 80000,
    joinDate: "2023-04-01",
  },
  {
    id: 15,
    name: "Olivia Thomas",
    email: "olivia@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 94000,
    joinDate: "2022-10-10",
  },
  {
    id: 16,
    name: "Peter Jackson",
    email: "peter@example.com",
    role: "Designer",
    department: "Design",
    salary: 87000,
    joinDate: "2021-12-05",
  },
  {
    id: 17,
    name: "Quinn Harris",
    email: "quinn@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 99000,
    joinDate: "2020-09-22",
  },
  {
    id: 18,
    name: "Rachel Clark",
    email: "rachel@example.com",
    role: "Manager",
    department: "HR",
    salary: 110000,
    joinDate: "2019-11-15",
  },
  {
    id: 19,
    name: "Sam Lewis",
    email: "sam@example.com",
    role: "Analyst",
    department: "Finance",
    salary: 76000,
    joinDate: "2023-06-12",
  },
  {
    id: 20,
    name: "Tina Walker",
    email: "tina@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 96000,
    joinDate: "2022-02-28",
  },
  {
    id: 21,
    name: "Uma Hall",
    email: "uma@example.com",
    role: "Designer",
    department: "Design",
    salary: 89000,
    joinDate: "2021-05-17",
  },
  {
    id: 22,
    name: "Victor Young",
    email: "victor@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 102000,
    joinDate: "2020-07-08",
  },
  {
    id: 23,
    name: "Wendy King",
    email: "wendy@example.com",
    role: "Manager",
    department: "Operations",
    salary: 116000,
    joinDate: "2019-04-20",
  },
  {
    id: 24,
    name: "Xavier Scott",
    email: "xavier@example.com",
    role: "Analyst",
    department: "Finance",
    salary: 79000,
    joinDate: "2023-03-05",
  },
  {
    id: 25,
    name: "Yara Green",
    email: "yara@example.com",
    role: "Engineer",
    department: "Engineering",
    salary: 93000,
    joinDate: "2022-07-14",
  },
];

const columns: ColumnDef<User>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "role", header: "Role", sortable: true },
  { key: "department", header: "Department", sortable: true },
  {
    key: "salary",
    header: "Salary",
    sortable: true,
    render: (value) => `$${(value as number).toLocaleString()}`,
  },
  { key: "joinDate", header: "Join Date", sortable: true },
];

export default function App() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Employee Directory</h1>
      <DataTable data={sampleData} columns={columns} pageSize={10} />
    </div>
  );
}
