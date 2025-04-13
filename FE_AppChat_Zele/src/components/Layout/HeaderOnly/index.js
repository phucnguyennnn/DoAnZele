import Header from './Header';
import Menu from './Menu';
import Sidebar from './Sidebar';

function DefaultLayout({ children }) {
    return (
        <div>
            <Sidebar />
            <div className="container">
                <div className="list-item">
                    <Header />
                    <Menu />
                </div>
                <div className="content">{children}</div>
            </div>
        </div>
    );
}

export default DefaultLayout;
