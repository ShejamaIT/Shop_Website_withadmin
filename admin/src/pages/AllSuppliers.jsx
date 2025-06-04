import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Input,
  Label,
} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import { useNavigate } from "react-router-dom";
import SupplierDetails from "./SupplierDetails";
import { toast } from "react-toastify";
import AddSupplier from "./AddSupplier";

const AllSuppliers = () => {
  const [activeTab, setActiveTab] = useState("addSupplier");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/admin/main/suppliers");
      const data = await response.json();
      if (data.suppliers && data.suppliers.length > 0) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Error fetching suppliers.");
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = (newSupplier) => {
    setSuppliers((prev) => [...prev, newSupplier]);
    setActiveTab("supplierDetails");
    setSelectedSupplierId(newSupplier.s_ID);
  };

  const handleSupplierSelect = (e) => {
    setSelectedSupplierId(e.target.value);
    setActiveTab("supplierDetails");
  };

  const selectedSupplier = suppliers.find(s => s.s_ID === selectedSupplierId);

  return (
    <Helmet title={"All-Suppliers"}>
      <section>
        <Container className="dashboard">
          <Nav tabs>
            <NavItem>
              <NavLink
                className={activeTab === "addSupplier" ? "active" : ""}
                onClick={() => setActiveTab("addSupplier")}
              >
                Add New Supplier
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === "supplierDetails" ? "active" : ""}
                onClick={() => setActiveTab("supplierDetails")}
              >
                View Supplier Details
              </NavLink>
            </NavItem>
          </Nav>

          <TabContent activeTab={activeTab}>
            <TabPane tabId="addSupplier">
              <Row>
                <Col>
                  <AddSupplier onAddSupplier={handleAddSupplier} />
                </Col>
              </Row>
            </TabPane>

            <TabPane tabId="supplierDetails">
              <Row className="mb-3">
                <Col md="4">
                  <Label for="supplierSelect">Select Supplier</Label>
                  <Input
                    id="supplierSelect"
                    type="select"
                    value={selectedSupplierId}
                    onChange={handleSupplierSelect}
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.s_ID} value={supplier.s_ID}>
                        {supplier.name}
                      </option>
                    ))}
                  </Input>
                </Col>
              </Row>

              <Row>
                <Col>
                  {selectedSupplier ? (
                    <SupplierDetails supplier={selectedSupplier} />
                  ) : (
                    <p>Please select a supplier to view details.</p>
                  )}
                </Col>
              </Row>
            </TabPane>
          </TabContent>
        </Container>
      </section>
    </Helmet>
  );
};

export default AllSuppliers;
